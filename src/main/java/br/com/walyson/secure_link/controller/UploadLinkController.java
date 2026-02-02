package br.com.walyson.secure_link.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import br.com.walyson.secure_link.dto.CreateLinkResponse;
import br.com.walyson.secure_link.dto.LinkUploadRequest;
import br.com.walyson.secure_link.service.UploadLinkService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/links")
@RequiredArgsConstructor
public class UploadLinkController {

  private final UploadLinkService uploadLinkService;

  @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @ResponseStatus(HttpStatus.CREATED)
  public CreateLinkResponse upload(@ModelAttribute LinkUploadRequest request) {

    return uploadLinkService.upload(
      request.file(), 
      request.expiresAt(), 
      request.maxViews(),
      request.password()
    );
  }
}
