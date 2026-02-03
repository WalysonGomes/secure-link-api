package br.com.walyson.secure_link.controller;

import java.io.IOException;
import java.net.URI;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;
import br.com.walyson.secure_link.domain.enums.LinkType;
import br.com.walyson.secure_link.dto.AccessContext;
import br.com.walyson.secure_link.dto.ResolveResult;
import br.com.walyson.secure_link.service.ResolveLinkService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class ResolveLinkController {

  private final ResolveLinkService resolveLinkService;

  @GetMapping("/l/{shortCode}")
  public ResponseEntity<Resource> resolve(
    @PathVariable String shortCode,
    @RequestHeader(value = "X-Link-Password", required = false) String password,
    HttpServletRequest request
  ) throws IOException {

    AccessContext context = new AccessContext(
      request.getRemoteAddr(),
      request.getHeader("User-Agent")
    );

    ResolveResult result = resolveLinkService.resolve(shortCode, password, context);


    if (result.type() == LinkType.REDIRECT) {
      return ResponseEntity.status(HttpStatus.FOUND)
      .location(URI.create(result.targetUrl()))
      .build();
    }

    return ResponseEntity.ok()
    .header(HttpHeaders.CONTENT_DISPOSITION,
      "attachment; filename=\"" + result.originalFilename() + "\"")
    .contentType(MediaType.APPLICATION_OCTET_STREAM)
    .body(result.fileUri());

  }
}
