package br.com.walyson.secure_link.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.Optional;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;

import br.com.walyson.secure_link.domain.SecureLink;
import br.com.walyson.secure_link.service.impl.RevokeLinkServiceImpl;
import br.com.walyson.secure_link.repository.SecureLinkRepository;

@ExtendWith(MockitoExtension.class)
class RevokeLinkServiceTest {

  @Mock
  private SecureLinkRepository repository;

  private MeterRegistry meterRegistry;
  private RevokeLinkServiceImpl service;

  @BeforeEach
  void setUp() {
    meterRegistry = new SimpleMeterRegistry();
    service = new RevokeLinkServiceImpl(repository, meterRegistry);
  }

  @Test
  @DisplayName("Deve revogar link ativo")
  void shouldRevokeActiveLink() {
    SecureLink link = new SecureLink(
        "abc123",
        "https://example.com",
        OffsetDateTime.now().plusHours(1),
        5);

    when(repository.findByShortCode("abc123"))
        .thenReturn(Optional.of(link));

    service.revoke("abc123");

    assertTrue(link.isRevoked());
    verify(repository).save(link);
  }

  @Test
  @DisplayName("Deve lançar 404 quando link não existir")
  void shouldThrowWhenLinkNotFound() {
    when(repository.findByShortCode("missing"))
        .thenReturn(Optional.empty());

    ResponseStatusException ex = assertThrows(
        ResponseStatusException.class,
        () -> service.revoke("missing"));

    assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    verify(repository, never()).save(any());
  }

  @Test
  @DisplayName("Deve ignorar revogação de link já revogado")
  void shouldIgnoreAlreadyRevokedLink() {
    SecureLink link = new SecureLink(
        "revoked",
        "https://example.com",
        OffsetDateTime.now().plusHours(1),
        5);

    link.revoke();

    when(repository.findByShortCode("revoked"))
        .thenReturn(Optional.of(link));

    service.revoke("revoked");

    verify(repository, never()).save(any());
  }
}
