package br.com.walyson.secure_link.controller;

import java.io.IOException;
import java.net.URI;
import java.util.Locale;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;
import br.com.walyson.secure_link.domain.enums.LinkType;
import br.com.walyson.secure_link.dto.AccessContextDto;
import br.com.walyson.secure_link.dto.ResolveRedirectResponseDto;
import br.com.walyson.secure_link.dto.ResolveResultDto;
import br.com.walyson.secure_link.service.ResolveLinkService;
import jakarta.servlet.http.HttpServletRequest;

@RestController
public class ResolveLinkController {

  private final ResolveLinkService resolveLinkService;

  public ResolveLinkController(ResolveLinkService resolveLinkService) {
    this.resolveLinkService = resolveLinkService;
  }

  @GetMapping("/l/{shortCode}")
  public ResponseEntity<?> resolve(
      @PathVariable String shortCode,
      @RequestHeader(value = "X-Link-Password", required = false) String password,
      @RequestHeader(value = HttpHeaders.ACCEPT, required = false) String acceptHeader,
      HttpServletRequest request) throws IOException {

    AccessContextDto context = new AccessContextDto(
        request.getRemoteAddr(),
        request.getHeader("User-Agent"));

    ResolveResultDto result = resolveLinkService.resolve(shortCode, password, context);

    if (result.type() == LinkType.REDIRECT) {
      boolean wantsJson = acceptHeader != null
          && acceptHeader.toLowerCase(Locale.ROOT).contains(MediaType.APPLICATION_JSON_VALUE);

      if (wantsJson) {
        return ResponseEntity.ok(new ResolveRedirectResponseDto("REDIRECT", result.targetUrl()));
      }

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
