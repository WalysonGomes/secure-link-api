package br.com.walyson.secure_link.service;

import java.time.OffsetDateTime;

import org.springframework.web.multipart.MultipartFile;

import br.com.walyson.secure_link.dto.CreateLinkResponseDto;

public interface UploadLinkService {

  CreateLinkResponseDto upload(MultipartFile file, OffsetDateTime expiresAt, Integer maxViews, String password);
  
}
