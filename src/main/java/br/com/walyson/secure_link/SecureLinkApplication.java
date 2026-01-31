package br.com.walyson.secure_link;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class SecureLinkApplication {

	public static void main(String[] args) {
		SpringApplication.run(SecureLinkApplication.class, args);
	}

}
