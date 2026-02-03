package br.com.walyson.secure_link.service;

import br.com.walyson.secure_link.dto.AccessContext;
import br.com.walyson.secure_link.dto.ResolveResult;


public interface ResolveLinkService {

  ResolveResult resolve(String shortCode, String password, AccessContext context);
  
}
