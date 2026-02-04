package br.com.walyson.secure_link.health;

import java.time.Duration;
import java.time.Instant;

import org.springframework.boot.health.contributor.Health;
import org.springframework.boot.health.contributor.HealthIndicator;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class SchedulerHealthIndicator implements HealthIndicator {

  private static final Duration MAX_DELAY = Duration.ofMinutes(2);

  private final SchedulerExecutionRegistry registry;

  @Override
  public Health health() {
    Instant lastExecution = registry.getLastExecution();

    if (lastExecution == null) {
      return Health.outOfService()
        .withDetail("scheduler", "never executed")
        .build();
    }

    Duration delay = Duration.between(lastExecution, Instant.now());

    if (delay.compareTo(MAX_DELAY) > 0) {
      return Health.outOfService()
        .withDetail("scheduler", "execution delayed")
        .withDetail("lastExecution", lastExecution)
        .withDetail("delaySeconds", delay.getSeconds())
        .build();
    }

    return Health.up()
      .withDetail("scheduler", "running")
      .withDetail("lastExecution", lastExecution)
      .build();
  }
}

