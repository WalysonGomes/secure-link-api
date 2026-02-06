package br.com.walyson.secure_link.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.com.walyson.secure_link.service.RevokeLinkService;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class RevokeLinkController {

  private final RevokeLinkService revokeLinkService;

  @DeleteMapping("/l/{shortCode}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void revoke(@PathVariable String shortCode){
    revokeLinkService.revoke(shortCode);
  }
}
