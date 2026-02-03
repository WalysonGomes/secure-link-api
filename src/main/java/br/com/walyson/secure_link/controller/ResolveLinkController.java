package br.com.walyson.secure_link.controller;

import java.io.IOException;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import br.com.walyson.secure_link.domain.SecureLink;
import br.com.walyson.secure_link.domain.enums.LinkType;
import br.com.walyson.secure_link.service.ResolveLinkService;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class ResolveLinkController {

  private final ResolveLinkService resolveLinkService;

  @GetMapping("/l/{shortCode}")
  public ResponseEntity<Resource> resolve(
    @PathVariable String shortCode,
    @RequestHeader(value = "X-Link-Password", required = false) String password
  ) throws IOException {

    SecureLink link = resolveLinkService.resolve(shortCode, password);

    if (link.getTargetUrl() != null && !link.getTargetUrl().isBlank()) {
      return ResponseEntity.status(HttpStatus.FOUND) 
          .location(URI.create(link.getTargetUrl()))
          .build();
    }

    if (link.getFilePath() == null) {
        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Link mapping error");
    }

    Path filePath = Paths.get(link.getFilePath());
    if(!Files.exists(filePath)){
      throw new ResponseStatusException(
        HttpStatus.NOT_FOUND, "File not found"
      );
    }

    Resource resource = new UrlResource(filePath.toUri());

    return ResponseEntity.ok()
    .header(HttpHeaders.CONTENT_DISPOSITION,
      "attachment; filename=\"" + link.getOriginalFileName() + "\"")
    .contentType(MediaType.APPLICATION_OCTET_STREAM)
    .body(resource);

  }
}
