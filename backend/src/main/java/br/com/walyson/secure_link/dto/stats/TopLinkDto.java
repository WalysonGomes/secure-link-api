package br.com.walyson.secure_link.dto.stats;

public record TopLinkDto(
  String shortCode,
  long accessCount
) {}
