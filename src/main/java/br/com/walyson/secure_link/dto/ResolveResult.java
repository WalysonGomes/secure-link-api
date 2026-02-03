package br.com.walyson.secure_link.dto;

import br.com.walyson.secure_link.domain.enums.LinkType;

import org.springframework.core.io.Resource;

public record ResolveResult(
    LinkType type,
    String targetUrl,
    Resource fileUri,
    String originalFilename
) {}
