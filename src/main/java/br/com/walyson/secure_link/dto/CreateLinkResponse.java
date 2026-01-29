package br.com.walyson.secure_link.dto;

import java.time.Instant;

public record CreateLinkResponse(
  String shortCode,
  String accessUrl,
  Instant expiresAt,
  Integer maxViews
) {}
