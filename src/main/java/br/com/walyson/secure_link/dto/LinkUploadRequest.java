package br.com.walyson.secure_link.dto;

import java.time.OffsetDateTime;

import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.constraints.NotNull;

public record LinkUploadRequest(
  @NotNull MultipartFile file,
  OffsetDateTime expiresAt,
  Integer maxViews,
  String password
) {}
