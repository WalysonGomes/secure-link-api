package br.com.walyson.secure_link.service;

import br.com.walyson.secure_link.domain.SecureLink;

public interface ResolveLinkService {

  SecureLink resolve(String shortCode, String password);
  
}
