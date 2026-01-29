package br.com.walyson.secure_link.dto;

import java.time.Instant;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record CreateLinkRequest(
  @Future Instant expiresAt,
  @Positive Integer maxViews,
  @NotBlank String originalFilename
) {}
