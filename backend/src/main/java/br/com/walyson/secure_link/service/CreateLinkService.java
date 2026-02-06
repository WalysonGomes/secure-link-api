package br.com.walyson.secure_link.service;

import br.com.walyson.secure_link.dto.CreateLinkRequestDto;
import br.com.walyson.secure_link.dto.CreateLinkResponseDto;

public interface CreateLinkService {
  CreateLinkResponseDto create(CreateLinkRequestDto request);
}
