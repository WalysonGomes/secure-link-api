package br.com.walyson.secure_link.service.impl;


import br.com.walyson.secure_link.dto.AccessContext;
import br.com.walyson.secure_link.dto.ResolveResult;

import java.nio.file.Files;
import java.nio.file.Paths;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import br.com.walyson.secure_link.utils.FileUtils;

import br.com.walyson.secure_link.domain.SecureLink;
import br.com.walyson.secure_link.domain.enums.LinkType;
import br.com.walyson.secure_link.domain.enums.AccessResult;
import br.com.walyson.secure_link.repository.SecureLinkRepository;
import br.com.walyson.secure_link.service.ResolveLinkService;
import br.com.walyson.secure_link.service.LinkAccessAuditService;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class ResolveLinkServiceImpl implements ResolveLinkService {

  private final FileUtils fileUtils;
  private final SecureLinkRepository repository;
  private final MeterRegistry meterRegistry;
  private final PasswordEncoder passwordEncoder;
  private final LinkAccessAuditService auditService;

  @Override
  @Transactional
  public ResolveResult resolve(String shortCode, String password, AccessContext context) {

    Timer.Sample timer = Timer.start(meterRegistry);

    try {
      log.info("secure_link_resolve_attempt | shortCode={}", shortCode);

      Counter.builder("secure_link_resolve_attempts_total")
        .register(meterRegistry)
        .increment();

      SecureLink link = repository.findByShortCode(shortCode)
      .orElseThrow(() -> {
        log.warn("secure_link_resolve_denied | shortCode={} reason=NOT_FOUND", shortCode);

        Counter.builder("secure_link_resolve_denied_total")
          .tag("reason", "not_found")
          .register(meterRegistry)
          .increment();

        auditService.audit(shortCode, AccessResult.NOT_FOUND, null, null);

        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Link not found");
      });

      if (link.isRevoked()) {
        handleDenied(link.getShortCode(), AccessResult.REVOKED, "revoked", context);
      }
      if (link.isExpired()) {
        repository.save(link);
        handleDenied(link.getShortCode(), AccessResult.EXPIRED, "expired", context);
      }
      if (link.hasReachedViewLimit()) {
        link.expire();
        repository.save(link);
        handleDenied(link.getShortCode(), AccessResult.VIEW_LIMIT_REACHED, "view_limit_reached", context);
      }
      if (!link.isActive()) {
        handleDenied(link.getShortCode(), AccessResult.UNEXPECTED_STATE, "inactive", context);
      }

      if (link.isPasswordProtected()) {
        if (password == null || password.isBlank()) {
          handleDenied(link.getShortCode(), AccessResult.PASSWORD_REQUIRED, "password_required", HttpStatus.UNAUTHORIZED, "Password required", context);
        }
        if (!passwordEncoder.matches(password, link.getPasswordHash())) {
          handleDenied(link.getShortCode(), AccessResult.INVALID_PASSWORD, "invalid_password", HttpStatus.UNAUTHORIZED, "Invalid password", context);
        }
      }

      link.incrementViewCount();
      repository.save(link);

      log.info("secure_link_resolve_success | shortCode={} viewCount={}", link.getShortCode(), link.getViewCount());

      Counter.builder("secure_link_resolve_success_total")
        .register(meterRegistry)
        .increment();

      auditService.audit(shortCode, AccessResult.SUCCESS, context.ipAddress(), context.userAgent());

      if (link.getTargetUrl() != null && !link.getTargetUrl().isBlank()) {
        return new ResolveResult(LinkType.REDIRECT, link.getTargetUrl(), null, null);
      }

      if (link.getFilePath() == null || !Files.exists(Paths.get(link.getFilePath()))) {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found");
      }


      Resource fileUri = fileUtils.getResource(link.getFilePath());
      return new ResolveResult(LinkType.DOWNLOAD, null,fileUri, link.getOriginalFileName());

    } finally {
      timer.stop(
        Timer.builder("secure_link_resolve_duration_seconds")
        .description("Time spent resolving secure links")
        .register(meterRegistry)
      );
    }
  }

  private void handleDenied(String shortCode, AccessResult result, String reason,AccessContext context) {
    handleDenied(shortCode, result, reason, HttpStatus.GONE, "Link access denied", context);
  }

  private void handleDenied(String shortCode, AccessResult result, String reason, HttpStatus status, String message, AccessContext context) {
    log.warn("secure_link_resolve_denied | shortCode={} reason={}", shortCode, reason);

    meterRegistry.counter("secure_link_resolve_denied_total", "reason", reason)
      .increment();

    auditService.audit(shortCode, result, context.ipAddress(), context.userAgent());

    throw new ResponseStatusException(status, message);
  }
}
