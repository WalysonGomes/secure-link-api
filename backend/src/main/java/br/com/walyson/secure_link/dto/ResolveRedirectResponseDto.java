package br.com.walyson.secure_link.dto;

public record ResolveRedirectResponseDto(
  String type,
  String targetUrl
) {}
