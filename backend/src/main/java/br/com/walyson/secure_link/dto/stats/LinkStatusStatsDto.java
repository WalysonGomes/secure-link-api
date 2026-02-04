package br.com.walyson.secure_link.dto.stats;

public record LinkStatusStatsDto(
  long active,
  long expired,
  long revoked
) {}

