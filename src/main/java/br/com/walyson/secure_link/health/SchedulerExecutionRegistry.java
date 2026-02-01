package br.com.walyson.secure_link.health;

import java.time.Instant;
import java.util.concurrent.atomic.AtomicReference;

import org.springframework.stereotype.Component;

@Component
public class SchedulerExecutionRegistry {

  private final AtomicReference<Instant> lastExecution = new AtomicReference<>();

  public void markExecution() {
    lastExecution.set(Instant.now());
  }

  public Instant getLastExecution() {
    return lastExecution.get();
  }
}
