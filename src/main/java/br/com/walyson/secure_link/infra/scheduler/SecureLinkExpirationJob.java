package br.com.walyson.secure_link.infra.scheduler;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import br.com.walyson.secure_link.service.SecureLinkExpirationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class SecureLinkExpirationJob {
  private final SecureLinkExpirationService service;

  @Scheduled(fixedDelayString = "PT1M")
  public void expireLinks() {
    int total = service.expireLinks();

    if (total > 0) {
      log.info("Expired {} secure links", total);
    }
  }

}
