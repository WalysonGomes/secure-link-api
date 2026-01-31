package br.com.walyson.secure_link.service.impl;

import org.springframework.stereotype.Service;

import br.com.walyson.secure_link.domain.SecureLink;
import br.com.walyson.secure_link.dto.CreateLinkRequest;
import br.com.walyson.secure_link.dto.CreateLinkResponse;
import br.com.walyson.secure_link.repository.SecureLinkRepository;
import br.com.walyson.secure_link.service.CreateLinkService;
import br.com.walyson.secure_link.utils.CodeUtils;

import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CreateLinkServiceImpl implements CreateLinkService {

  private final CodeUtils codeUtils;
  private final SecureLinkRepository repository;

  @Override
  @Transactional
  public CreateLinkResponse create(CreateLinkRequest request) {
    String shortCode = codeUtils.generateUniqueShortCode();

    SecureLink link = new SecureLink(
      shortCode,
      request.targetUrl(),
      request.expiresAt(),
      request.maxViews()
    );

    repository.save(link);

    return new CreateLinkResponse(
      link.getShortCode(),
      codeUtils.generateAccessUrl(link.getShortCode()),
      link.getExpiresAt(),
      link.getMaxViews()
    );

  }

}
