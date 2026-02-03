package br.com.walyson.secure_link.service.impl;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import br.com.walyson.secure_link.domain.LinkStatus;
import br.com.walyson.secure_link.domain.SecureLink;
import br.com.walyson.secure_link.repository.SecureLinkRepository;
import br.com.walyson.secure_link.service.ResolveLinkService;
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

  private final SecureLinkRepository repository;
  private final MeterRegistry meterRegistry;
  private final PasswordEncoder passwordEncoder;

  @Override
  @Transactional
  public SecureLink resolve(String shortCode, String password) {

    Timer.Sample timer = Timer.start(meterRegistry);

    try{
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

        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Link not found");
      });

      if (link.isRevoked()) {
        log.warn("secure_link_resolve_denied | shortCode={} reason=REVOKED", shortCode);

        meterRegistry.counter(
          "secure_link_resolve_denied_total",
          "reason", "revoked"
        ).increment();

        throw new ResponseStatusException(HttpStatus.GONE, "Link revoked");
      }

      if (link.isExpired()) {
        repository.save(link);
        log.warn("secure_link_resolve_denied | shortCode={} reason=EXPIRED", shortCode);

        Counter.builder("secure_link_resolve_denied_total")
          .tag("reason", "expired")
          .register(meterRegistry)
          .increment();

        throw new ResponseStatusException(HttpStatus.GONE, "Link has expired");
      }

      if (link.hasReachedViewLimit()) {
        link.expire();
        repository.save(link);
        log.warn("secure_link_resolve_denied | shortCode={} reason=VIEW_LIMIT_REACHED", shortCode);

        Counter.builder("secure_link_resolve_denied_total")
          .tag("reason", "view_limit_reached")
          .register(meterRegistry)
          .increment();

        throw new ResponseStatusException(HttpStatus.GONE, "View limit reached");
      }

      if (!link.isActive()) {
        log.warn(
          "secure_link_resolve_denied | shortCode={} reason=STATUS_{}",
          shortCode,
          link.getStatus()
        );

        meterRegistry.counter(
          "secure_link_resolve_denied_total",
          "reason", "inactive"
        ).increment();

        throw new ResponseStatusException(HttpStatus.GONE, "Link is no longer active");
      }


      if (link.isPasswordProtected()) {
        if (password == null || password.isBlank()) {
          log.warn("secure_link_resolve_denied | shortCode={} reason=PASSWORD_REQUIRED", shortCode);

          meterRegistry.counter("secure_link_resolve_denied_total", "reason", "password_required")
            .increment();

          throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Password required");
        }

        if (!passwordEncoder.matches(password, link.getPasswordHash())) {
          log.warn("secure_link_resolve_denied | shortCode={} reason=INVALID_PASSWORD", shortCode);

          meterRegistry.counter("secure_link_resolve_denied_total", "reason", "invalid_password")
            .increment();

          throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid password");
        }
      }


      link.incrementViewCount();
      repository.save(link);

      log.info("secure_link_resolve_success | shortCode={} viewCount={}", link.getShortCode(), link.getViewCount());

      Counter.builder("secure_link_resolve_success_total")
        .register(meterRegistry)
        .increment();

      return link;

    }finally{
      timer.stop(
        Timer.builder("secure_link_resolve_duration_seconds")
        .description("Time spent resolving secure links")
        .register(meterRegistry)
      );
    }
  }
}
