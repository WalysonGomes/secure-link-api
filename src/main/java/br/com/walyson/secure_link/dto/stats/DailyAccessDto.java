package br.com.walyson.secure_link.dto.stats;

import java.time.LocalDate;

public record DailyAccessDto(
  LocalDate date,
  long count
) {}
