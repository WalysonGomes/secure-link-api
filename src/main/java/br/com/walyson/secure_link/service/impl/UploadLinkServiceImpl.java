package br.com.walyson.secure_link.service.impl;

import java.time.OffsetDateTime;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import io.micrometer.core.instrument.MeterRegistry;

import br.com.walyson.secure_link.domain.SecureLink;
import br.com.walyson.secure_link.dto.CreateLinkResponseDto;
import br.com.walyson.secure_link.repository.SecureLinkRepository;
import br.com.walyson.secure_link.service.UploadLinkService;
import br.com.walyson.secure_link.utils.CodeUtils;
import br.com.walyson.secure_link.utils.FileUtils;
import br.com.walyson.secure_link.config.LinkTtlProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class UploadLinkServiceImpl implements UploadLinkService {


  private final CodeUtils codeUtils;
  private final FileUtils fileUtils;
  private final SecureLinkRepository repository;
  private final MeterRegistry meterRegistry;
  private final PasswordEncoder passwordEncoder;
  private final LinkTtlProperties linkTtlProperties;

  @Transactional
  public CreateLinkResponseDto upload(MultipartFile file, OffsetDateTime expiresAt, Integer maxViews, String password) {

    if(file.isEmpty()){
      throw new ResponseStatusException(
        HttpStatus.BAD_REQUEST, "File is required"
      );
    }

    String shortCode = codeUtils.generateUniqueShortCode();
    String storedFilename = fileUtils.storeFile(file);
    String filePath = fileUtils.generateFilePath(storedFilename);

    OffsetDateTime resolvedExpiresAt = resolveExpiresAt(expiresAt);

    SecureLink link = new SecureLink(
      shortCode,
      filePath,
      file.getOriginalFilename(),
      resolvedExpiresAt,
      maxViews
    );

    if (password != null && !password.isBlank()) {
      String hash = passwordEncoder.encode(password);
      link.protectWithPassword(hash);
    }

    repository.save(link);

    meterRegistry.counter("secure_link_created_total", "type", "FILE").increment();

    log.info("secure_link_created | type=FILE shortCode={} expiresAt={} maxViews={} passwordProtected={}",
      link.getShortCode(),
      link.getExpiresAt(),
      link.getMaxViews(),
      link.isPasswordProtected()
    );

    return new CreateLinkResponseDto(
      link.getShortCode(),
      codeUtils.generateAccessUrl(link.getShortCode()),
      link.getExpiresAt(),
      link.getMaxViews()
    );
  }


  private OffsetDateTime resolveExpiresAt(OffsetDateTime requestedExpiresAt) {
    return requestedExpiresAt != null
    ? requestedExpiresAt
    : OffsetDateTime.now().plus(linkTtlProperties.getDefaultTtl());
  }

}
