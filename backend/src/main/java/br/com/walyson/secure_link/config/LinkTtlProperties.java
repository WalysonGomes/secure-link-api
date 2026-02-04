package br.com.walyson.secure_link.config;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
@Validated
@ConfigurationProperties(prefix = "app.link")
public class LinkTtlProperties {

  @NotNull
  private Duration defaultTtl;

}
