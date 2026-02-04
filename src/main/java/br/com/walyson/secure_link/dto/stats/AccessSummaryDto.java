package br.com.walyson.secure_link.dto.stats;

import com.fasterxml.jackson.annotation.JsonProperty;

public record AccessSummaryDto(
  long total,
  long success,
  long failed,
  long expired,
  long uniqueOrigins
) {
  @JsonProperty("accessEfficiencyRatio")
  public double getAccessEfficiencyRatio() {
    if (total == 0) return 0.0;
    return (success * 100.0) / total;
  }

  @JsonProperty("expirationAttritionRate")
  public double getExpirationAttritionRate() {
    if (total == 0) return 0.0;
    return (expired * 100.0) / total;
  }
}
