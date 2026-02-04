package br.com.walyson.secure_link.dto.stats;

public record HourlyAccessDto(
    int hour,
    long count
) {}
