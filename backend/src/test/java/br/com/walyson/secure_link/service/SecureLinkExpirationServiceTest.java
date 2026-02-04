package br.com.walyson.secure_link.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.List;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

import br.com.walyson.secure_link.domain.SecureLink;
import br.com.walyson.secure_link.service.impl.SecureLinkExpirationServiceImpl;
import br.com.walyson.secure_link.repository.SecureLinkRepository;

@ExtendWith(MockitoExtension.class)
class SecureLinkExpirationServiceTest {

  @Mock
  private SecureLinkRepository repository;

  private SecureLinkExpirationServiceImpl service;

  @BeforeEach
  void setUp() {
    service = new SecureLinkExpirationServiceImpl(repository);
  }

  @Test
  @DisplayName("Deve expirar links vencidos")
  void shouldExpireLinks() {
    SecureLink link1 = new SecureLink(
        "l1",
        "url",
        OffsetDateTime.now().minusMinutes(10),
        5);

    SecureLink link2 = new SecureLink(
        "l2",
        "url",
        OffsetDateTime.now().minusMinutes(20),
        3);

    when(repository.findLinksToExpire(any()))
        .thenReturn(List.of(link1, link2));

    int expired = service.expireLinks();

    assertEquals(2, expired);
    assertTrue(link1.isExpired());
    assertTrue(link2.isExpired());

    verify(repository).saveAll(List.of(link1, link2));
  }

  @Test
  @DisplayName("Deve retornar 0 quando não houver links para expirar")
  void shouldReturnZeroWhenNoLinksToExpire() {
    when(repository.findLinksToExpire(any()))
        .thenReturn(List.of());

    int expired = service.expireLinks();

    assertEquals(0, expired);
    verify(repository).saveAll(List.of());
  }
}
