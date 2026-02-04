package br.com.walyson.secure_link.service;


import br.com.walyson.secure_link.domain.enums.AccessResult;

public interface LinkAccessAuditService {

  void audit(String shortCode, AccessResult result, String ipAddress, String userAgent) ;
}
