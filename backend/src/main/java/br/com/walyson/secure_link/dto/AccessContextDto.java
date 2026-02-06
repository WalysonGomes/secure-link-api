package br.com.walyson.secure_link.dto;

public record AccessContextDto(
  String ipAddress,
  String userAgent
) {}
