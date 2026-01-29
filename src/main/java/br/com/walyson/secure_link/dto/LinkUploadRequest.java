package br.com.walyson.secure_link.dto;

import java.time.Instant;

import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.constraints.NotNull;

public record LinkUploadRequest(
  @NotNull MultipartFile file,
  Instant expiresAt,
  Integer maxViews
) {}
