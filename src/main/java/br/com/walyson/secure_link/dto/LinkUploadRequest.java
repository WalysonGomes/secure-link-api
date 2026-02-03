package br.com.walyson.secure_link.dto;

import java.time.OffsetDateTime;

import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record LinkUploadRequest(
  @NotNull MultipartFile file,
  @Future OffsetDateTime expiresAt,
  @Positive Integer maxViews,
  String password
) {}
