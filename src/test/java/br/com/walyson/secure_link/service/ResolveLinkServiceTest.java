package br.com.walyson.secure_link.service;

import java.time.OffsetDateTime;
import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

import br.com.walyson.secure_link.domain.LinkStatus;
import br.com.walyson.secure_link.domain.SecureLink;
import br.com.walyson.secure_link.repository.SecureLinkRepository;
import br.com.walyson.secure_link.service.impl.ResolveLinkServiceImpl;

@ExtendWith(MockitoExtension.class)
class ResolveLinkServiceTest {
  
  @Mock
  private SecureLinkRepository repository;
  
  @InjectMocks
  private ResolveLinkServiceImpl service;

  @Test
  @DisplayName("Deve resolver um link de URL (encurtador), incrementar visualização e salvar")
  void shouldResolveUrlLink() {
    SecureLink link = new SecureLink(
      "xyz789",
      "https://google.com",
      OffsetDateTime.now().plusSeconds(3600),
      5
    );

    when(repository.findByShortCode("xyz789")).thenReturn(Optional.of(link));
    
    SecureLink resolved = service.resolve("xyz789");
    
    assertEquals(1, resolved.getViewCount());
    assertEquals("https://google.com", resolved.getTargetUrl());
    verify(repository, times(1)).save(link);
  }
  
  @Test
  @DisplayName("Deve resolver um link de arquivo ativo, incrementar visualização e salvar")
  void shouldResolveActiveLink() {
    SecureLink link = new SecureLink(
      "abc123",
      "/tmp/uploads/test.txt",
      "test.txt",
      OffsetDateTime.now().plusSeconds(3600),
      10
    );

    when(repository.findByShortCode("abc123")).thenReturn(Optional.of(link));
    
    SecureLink resolved = service.resolve("abc123");
    
    assertEquals(1, resolved.getViewCount());
    assertEquals(LinkStatus.ACTIVE, resolved.getStatus());
    verify(repository, times(1)).save(link);
  }
  
  @Test
  @DisplayName("Deve lançar 404 NOT FOUND quando o shortCode não existir")
  void shouldThrowNotFoundWhenLinkDoesNotExist() {
    when(repository.findByShortCode("x")).thenReturn(Optional.empty());

    ResponseStatusException ex = assertThrows(
      ResponseStatusException.class,
      () -> service.resolve("x")
    );

    assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    verify(repository, never()).save(any());
  }

  @Test
  @DisplayName("Deve lançar 410 GONE quando o link estiver expirado")
  void shouldThrowGoneWhenLinkIsExpired() {
    SecureLink link = new SecureLink("abc", "url", OffsetDateTime.now().minusSeconds(10), 3);
    when(repository.findByShortCode("abc")).thenReturn(Optional.of(link));
    
    assertThrows(ResponseStatusException.class, () -> service.resolve("abc"));
    assertEquals(LinkStatus.EXPIRED, link.getStatus());
    verify(repository).save(link); 
  }
}
