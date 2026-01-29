package br.com.walyson.secure_link.utils;

import org.springframework.stereotype.Component;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;

import org.springframework.beans.factory.annotation.Value;
import br.com.walyson.secure_link.repository.SecureLinkRepository;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class CodeUtils {

  @Value("${app.base-url}")
  private String baseUrl;

  private final SecureLinkRepository repository;

  public String generateUniqueShortCode() {
    String code;
    do {
      code = NanoIdUtils.randomNanoId(
        NanoIdUtils.DEFAULT_NUMBER_GENERATOR,
        NanoIdUtils.DEFAULT_ALPHABET,
        8
      );
    } while (repository.existsByShortCode(code));
    return code;
  }

  public String generateAccessUrl(String shortCode) {
    return baseUrl + "/l/" + shortCode;
  }
}
