package br.com.walyson.secure_link;

import java.util.TimeZone;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

import jakarta.annotation.PostConstruct;

@EnableScheduling
@SpringBootApplication
@ConfigurationPropertiesScan
public class SecureLinkApplication {

  @PostConstruct
  public void init() {
    TimeZone.setDefault(TimeZone.getTimeZone("America/Sao_Paulo"));
  }

	public static void main(String[] args) {
		SpringApplication.run(SecureLinkApplication.class, args);
	}

}
