package br.com.walyson.secure_link.health;

import java.time.Instant;

import org.springframework.boot.health.contributor.Health;
import org.springframework.boot.health.contributor.HealthIndicator;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class DatabaseHealthIndicator implements HealthIndicator {

  private final JdbcTemplate jdbcTemplate;

  @Override
  public Health health() {
    try {
      Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);

      if (result != null && result == 1) {
        return Health.up()
          .withDetail("database", "reachable")
          .withDetail("checkedAt", Instant.now())
          .build();
      }

      return Health.down()
        .withDetail("database", "unexpected response")
        .build();

    } catch (Exception e) {
      return Health.down()
        .withDetail("database", "unreachable")
        .withException(e)
        .build();
    }
  }
}
