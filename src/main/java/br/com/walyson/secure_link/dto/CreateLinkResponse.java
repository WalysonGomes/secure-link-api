package br.com.walyson.secure_link.dto;

import java.time.OffsetDateTime;

public record CreateLinkResponse(
  String shortCode,
  String accessUrl,
  OffsetDateTime expiresAt,
  Integer maxViews
) {}
