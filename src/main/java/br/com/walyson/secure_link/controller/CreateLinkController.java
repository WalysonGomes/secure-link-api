package br.com.walyson.secure_link.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.com.walyson.secure_link.dto.CreateLinkRequest;
import br.com.walyson.secure_link.dto.CreateLinkResponse;
import br.com.walyson.secure_link.service.CreateLinkService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/links")
@RequiredArgsConstructor
public class CreateLinkController {

  private final CreateLinkService createLinkService;

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public CreateLinkResponse create(@RequestBody @Valid CreateLinkRequest request){
    return createLinkService.create(request);
  }
}
