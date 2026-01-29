package br.com.walyson.secure_link.dto.error;

import java.time.Instant;

public record ApiError(
  Instant timestamp,
  int status,
  String error,
  String message,
  String path
) {}
