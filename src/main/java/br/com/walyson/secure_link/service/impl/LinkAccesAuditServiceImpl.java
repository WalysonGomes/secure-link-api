package br.com.walyson.secure_link.service.impl;

import java.time.OffsetDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import br.com.walyson.secure_link.domain.enums.AccessResult;
import br.com.walyson.secure_link.domain.LinkAccessAudit;
import br.com.walyson.secure_link.service.LinkAccessAuditService;
import br.com.walyson.secure_link.repository.LinkAccessAuditRepository;
import lombok.RequiredArgsConstructor;


@Service
@RequiredArgsConstructor
public class LinkAccesAuditServiceImpl implements LinkAccessAuditService {

  private final LinkAccessAuditRepository repository;

  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void audit(String shortCode, AccessResult result, String ipAddress, String userAgent) {

    LinkAccessAudit audit = LinkAccessAudit.builder()
    .shortCode(shortCode)
    .result(result)
    .ipAddress(ipAddress)
    .userAgent(userAgent)
    .accessedAt(OffsetDateTime.now())
    .build();

    repository.save(audit);
  }


}
