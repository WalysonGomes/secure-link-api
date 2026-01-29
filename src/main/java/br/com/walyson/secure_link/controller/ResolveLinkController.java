package br.com.walyson.secure_link.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import br.com.walyson.secure_link.domain.SecureLink;
import br.com.walyson.secure_link.service.ResolveLinkService;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class ResolveLinkController {

  private final ResolveLinkService resolveLinkService;

  @GetMapping("/l/{shortCode}")
  public ResponseEntity<Resource> resolve(@PathVariable String shortCode) throws IOException{

    SecureLink link = resolveLinkService.resolve(shortCode);

    Path filePath = Paths.get(link.getFilePath());

    if(!Files.exists(filePath)){
      throw new ResponseStatusException(
        HttpStatus.NOT_FOUND, "File not found"
      );
    }

    Resource resource = new UrlResource(filePath.toUri());

    return ResponseEntity.ok()
    .header(HttpHeaders.CONTENT_DISPOSITION,
      "inline; filename=\"" + link.getOriginalFileName() + "\"")
    .body(resource);

  }
}
