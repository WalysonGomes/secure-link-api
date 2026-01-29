package br.com.walyson.secure_link.service;

import br.com.walyson.secure_link.dto.CreateLinkRequest;
import br.com.walyson.secure_link.dto.CreateLinkResponse;

public interface CreateLinkService {
  CreateLinkResponse create(CreateLinkRequest request);
}
