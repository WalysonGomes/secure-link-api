package br.com.walyson.secure_link.service;

import br.com.walyson.secure_link.dto.AccessContextDto;
import br.com.walyson.secure_link.dto.ResolveResultDto;


public interface ResolveLinkService {

  ResolveResultDto resolve(String shortCode, String password, AccessContextDto context);
  
}
