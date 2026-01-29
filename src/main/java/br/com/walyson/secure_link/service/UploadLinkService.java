package br.com.walyson.secure_link.service;

import java.time.Instant;

import org.springframework.web.multipart.MultipartFile;

import br.com.walyson.secure_link.dto.CreateLinkResponse;

public interface UploadLinkService {

  CreateLinkResponse upload(MultipartFile file, Instant expiresAt, Integer maxViews);
  
}
