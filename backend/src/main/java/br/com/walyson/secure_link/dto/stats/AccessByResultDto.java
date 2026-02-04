package br.com.walyson.secure_link.dto.stats;

import br.com.walyson.secure_link.domain.enums.AccessResult;

public record AccessByResultDto(
  AccessResult result,
  long count
) {}

