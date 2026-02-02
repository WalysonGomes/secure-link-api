package br.com.walyson.secure_link.service;

import java.time.OffsetDateTime;

import org.springframework.web.multipart.MultipartFile;

import br.com.walyson.secure_link.dto.CreateLinkResponse;

public interface UploadLinkService {

  CreateLinkResponse upload(MultipartFile file, OffsetDateTime expiresAt, Integer maxViews, String password);
  
}
