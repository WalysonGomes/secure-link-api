package br.com.walyson.secure_link.service.impl;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import br.com.walyson.secure_link.domain.LinkStatus;
import br.com.walyson.secure_link.domain.SecureLink;
import br.com.walyson.secure_link.repository.SecureLinkRepository;
import br.com.walyson.secure_link.service.ResolveLinkService;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class ResolveLinkServiceImpl implements ResolveLinkService {

  private final SecureLinkRepository repository;

  @Override
  @Transactional
  public SecureLink resolve(String shortCode) {
    log.info("secure_link_resolve_attempt | shortCode={}", shortCode);

    SecureLink link = repository.findByShortCode(shortCode)
    .orElseThrow(() -> {
      log.warn("secure_link_resolve_denied | shortCode={} reason=NOT_FOUND", shortCode);
      return new ResponseStatusException(HttpStatus.NOT_FOUND, "Link not found");
    });

    if (link.isExpired()) {
      repository.save(link);
      log.warn("secure_link_resolve_denied | shortCode={} reason=EXPIRED", shortCode);
      throw new ResponseStatusException(HttpStatus.GONE, "Link has expired");
    }

    if (link.hasReachedViewLimit()) {
      link.expire();
      repository.save(link);
      log.warn("secure_link_resolve_denied | shortCode={} reason=VIEW_LIMIT_REACHED", shortCode);
      throw new ResponseStatusException(HttpStatus.GONE, "View limit reached");
    }

    if (link.getStatus() != LinkStatus.ACTIVE) {
      log.warn("secure_link_resolve_denied | shortCode={} reason=STATUS_{}", shortCode, link.getStatus());
      throw new ResponseStatusException(HttpStatus.GONE, "Link is no longer active");
    }

    link.incrementViewCount();
    repository.save(link);

    log.info("secure_link_resolve_success | shortCode={} viewCount={}", link.getShortCode(), link.getViewCount());

    return link;
  }
}
