package br.com.walyson.secure_link.service.impl;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import br.com.walyson.secure_link.domain.LinkStatus;
import br.com.walyson.secure_link.domain.SecureLink;
import br.com.walyson.secure_link.repository.SecureLinkRepository;
import br.com.walyson.secure_link.service.ResolveLinkService;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ResolveLinkServiceImpl implements ResolveLinkService {

  private final SecureLinkRepository repository;

  @Override
  @Transactional
  public SecureLink resolve(String shortCode) {

    SecureLink link = repository.findByShortCode(shortCode)
    .orElseThrow(() -> new ResponseStatusException(
      HttpStatus.NOT_FOUND, "Link not found"
    ));

    if(link.isExpired()){
      repository.save(link);
      throw new ResponseStatusException(
        HttpStatus.GONE, "Link has expired"
      );
    }


    if(link.hasReachedViewLimit()){
      link.expire();
      repository.save(link);
      throw new ResponseStatusException(
        HttpStatus.GONE, "View limit reached"
      );
    }


    if(link.getStatus() != LinkStatus.ACTIVE){
      throw new ResponseStatusException(
        HttpStatus.GONE, "Link is no longer active"
      );
    }

    link.incrementViewCount();
    repository.save(link);

    return link;

  }


}
