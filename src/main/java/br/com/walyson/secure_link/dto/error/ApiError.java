package br.com.walyson.secure_link.dto.error;

import java.time.OffsetDateTime;

public record ApiError(
  OffsetDateTime timestamp,
  int status,
  String error,
  String message,
  String path
) {}
