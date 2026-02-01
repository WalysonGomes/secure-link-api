package br.com.walyson.secure_link.service.impl;

import org.springframework.stereotype.Service;

import br.com.walyson.secure_link.domain.SecureLink;
import br.com.walyson.secure_link.dto.CreateLinkRequest;
import br.com.walyson.secure_link.dto.CreateLinkResponse;
import br.com.walyson.secure_link.repository.SecureLinkRepository;
import br.com.walyson.secure_link.service.CreateLinkService;
import br.com.walyson.secure_link.utils.CodeUtils;

import io.micrometer.core.instrument.MeterRegistry;

import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class CreateLinkServiceImpl implements CreateLinkService {

  private final CodeUtils codeUtils;
  private final SecureLinkRepository repository;
  private final MeterRegistry meterRegistry;

  @Override
  @Transactional
  public CreateLinkResponse create(CreateLinkRequest request) {
    String shortCode = codeUtils.generateUniqueShortCode();

    SecureLink link = new SecureLink(
      shortCode,
      request.targetUrl(),
      request.expiresAt(),
      request.maxViews()
    );

    repository.save(link);

    meterRegistry.counter("secure_link_created_total", "type", "REDIRECT").increment();

    log.info("secure_link_created | type=REDIRECT shortCode={} expiresAt={} maxViews={}",
      link.getShortCode(),
      link.getExpiresAt(),
      link.getMaxViews()
    );

    return new CreateLinkResponse(
      link.getShortCode(),
      codeUtils.generateAccessUrl(link.getShortCode()),
      link.getExpiresAt(),
      link.getMaxViews()
    );
  }
}
