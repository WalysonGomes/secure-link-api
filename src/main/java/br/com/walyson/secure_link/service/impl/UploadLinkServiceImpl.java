package br.com.walyson.secure_link.service.impl;

import java.time.Instant;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import br.com.walyson.secure_link.domain.SecureLink;
import br.com.walyson.secure_link.dto.CreateLinkResponse;
import br.com.walyson.secure_link.repository.SecureLinkRepository;
import br.com.walyson.secure_link.service.UploadLinkService;
import br.com.walyson.secure_link.utils.CodeUtils;
import br.com.walyson.secure_link.utils.FileUtils;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UploadLinkServiceImpl implements UploadLinkService {


  private final CodeUtils codeUtils;
  private final FileUtils fileUtils;
  private final SecureLinkRepository repository;

  @Override
  @Transactional
  public CreateLinkResponse upload(MultipartFile file, Instant expiresAt, Integer maxViews) {

    if(file.isEmpty()){
      throw new ResponseStatusException(
        HttpStatus.BAD_REQUEST, "File is required"
      );
    }

    String shortCode = codeUtils.generateUniqueShortCode();
    String storedFilename = fileUtils.storeFile(file);
    String filePath = fileUtils.generateFilePath(storedFilename);

    SecureLink link = new SecureLink(
      shortCode,
      filePath,
      file.getOriginalFilename(),
      expiresAt,
      maxViews

    );

    repository.save(link);

    return new CreateLinkResponse(
      shortCode,
      codeUtils.generateAccessUrl(shortCode),
      expiresAt,
      maxViews
    );


  }


}
