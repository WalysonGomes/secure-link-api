package br.com.walyson.secure_link.service.impl;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.walyson.secure_link.domain.SecureLink;
import br.com.walyson.secure_link.repository.SecureLinkRepository;
import br.com.walyson.secure_link.service.RevokeLinkService;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class RevokeLinkServiceImpl implements RevokeLinkService {

  private final SecureLinkRepository repository;
  private final MeterRegistry meterRegistry;

  @Override
  @Transactional
  public void revoke(String shortCode) {

    SecureLink link = repository.findByShortCode(shortCode)
        .orElseThrow(() -> {
          log.warn("secure_link_revoke_denied | shortCode={} reason=NOT_FOUND", shortCode);

          meterRegistry.counter(
              "secure_link_revoke_denied_total",
              "reason", "not_found").increment();

          return new ResponseStatusException(HttpStatus.NOT_FOUND, "Link not found");
        });

    if (link.isRevoked()) {
      log.info("secure_link_revoke_ignored | shortCode={} reason=ALREADY_REVOKED", shortCode);
      return;
    }

    link.revoke();
    repository.save(link);

    log.info("secure_link_revoked | shortCode={}", shortCode);

    meterRegistry.counter("secure_link_revoked_total").increment();

  }

}
