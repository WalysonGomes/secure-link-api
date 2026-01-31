package br.com.walyson.secure_link.service.impl;

import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.walyson.secure_link.domain.SecureLink;
import br.com.walyson.secure_link.repository.SecureLinkRepository;
import br.com.walyson.secure_link.service.SecureLinkExpirationService;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SecureLinkExpirationServiceImpl implements SecureLinkExpirationService {

  private final SecureLinkRepository repository;

  @Override
  @Transactional
  public int expireLinks() {
    Instant now = Instant.now();
    
    List<SecureLink> expiredLinks =
    repository.findLinksToExpire(now);
    
    expiredLinks.forEach(link ->
      link.expire());;
    
    repository.saveAll(expiredLinks);
    
    return expiredLinks.size();
  }
}
