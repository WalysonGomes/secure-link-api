package br.com.walyson.secure_link.health;

import java.nio.file.Files;
import java.nio.file.Path;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.health.contributor.Health;
import org.springframework.boot.health.contributor.HealthIndicator;
import org.springframework.stereotype.Component;

@Component
public class StorageHealthIndicator implements HealthIndicator {

  @Value("${app.storage.path}")
  private String storagePath;

  @Override
  public Health health() {
    try {
      Path path = Path.of(storagePath);
      if (Files.exists(path) && Files.isWritable(path)) {
        return Health.up().build();
      }
      return Health.down().withDetail("storage", "Not writable").build();
    } catch (Exception e) {
      return Health.down(e).build();
    }
  }
}
