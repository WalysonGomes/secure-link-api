package br.com.walyson.secure_link.dto;

import java.time.OffsetDateTime;

import org.hibernate.validator.constraints.URL;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record CreateLinkRequest(
  @Future OffsetDateTime expiresAt,
  @Positive Integer maxViews,
  @NotBlank @URL String targetUrl,
  String password 
) {}
