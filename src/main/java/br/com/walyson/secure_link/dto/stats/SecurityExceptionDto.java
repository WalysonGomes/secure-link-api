package br.com.walyson.secure_link.dto.stats;

public record SecurityExceptionDto(
    String shortCode,
    long count
) {}
