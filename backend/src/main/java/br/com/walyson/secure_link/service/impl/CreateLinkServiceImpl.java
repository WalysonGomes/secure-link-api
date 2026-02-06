package br.com.walyson.secure_link.service.impl;

import java.time.OffsetDateTime;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import br.com.walyson.secure_link.domain.SecureLink;
import br.com.walyson.secure_link.dto.CreateLinkRequestDto;
import br.com.walyson.secure_link.dto.CreateLinkResponseDto;
import br.com.walyson.secure_link.repository.SecureLinkRepository;
import br.com.walyson.secure_link.service.CreateLinkService;
import br.com.walyson.secure_link.utils.CodeUtils;
import br.com.walyson.secure_link.config.LinkTtlProperties;

import io.micrometer.core.instrument.MeterRegistry;

import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class CreateLinkServiceImpl implements CreateLinkService {

  private final CodeUtils codeUtils;
  private final SecureLinkRepository repository;
  private final MeterRegistry meterRegistry;
  private final PasswordEncoder passwordEncoder;
  private final LinkTtlProperties linkTtlProperties;

  @Override
  @Transactional
  public CreateLinkResponseDto create(CreateLinkRequestDto request) {
    String shortCode = codeUtils.generateUniqueShortCode();
    OffsetDateTime expiresAt = resolveExpiresAt(request.expiresAt());

    SecureLink link = new SecureLink(
      shortCode,
      request.targetUrl(),
      expiresAt,
      request.maxViews()
    );

    if (request.password() != null && !request.password().isBlank()) {
      String hash = passwordEncoder.encode(request.password());
      link.protectWithPassword(hash);
    }

    repository.save(link);

    meterRegistry.counter("secure_link_created_total", "type", "REDIRECT").increment();

    log.info(
      "secure_link_created | type=REDIRECT shortCode={} expiresAt={} maxViews={} passwordProtected={}",
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
