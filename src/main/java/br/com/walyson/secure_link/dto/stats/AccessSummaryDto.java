package br.com.walyson.secure_link.dto.stats;

public record AccessSummaryDto(
  long total,
  long success,
  long failed
) {}
