package br.com.walyson.secure_link.dto;

public record AccessContext(
  String ipAddress,
  String userAgent
) {}
