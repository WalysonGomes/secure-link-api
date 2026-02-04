package br.com.walyson.secure_link.service;

import java.time.Duration;
import java.time.OffsetDateTime;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

import br.com.walyson.secure_link.config.LinkTtlProperties;
import br.com.walyson.secure_link.domain.SecureLink;
import br.com.walyson.secure_link.dto.CreateLinkRequestDto;
import br.com.walyson.secure_link.dto.CreateLinkResponseDto;
import br.com.walyson.secure_link.repository.SecureLinkRepository;
import br.com.walyson.secure_link.service.impl.CreateLinkServiceImpl;
import br.com.walyson.secure_link.utils.CodeUtils;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;

import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class CreateLinkServiceTest {

  @Mock
  private CodeUtils codeUtils;

  @Mock
  private SecureLinkRepository repository;

  @Mock
  private PasswordEncoder passwordEncoder;

  @Mock
  private LinkTtlProperties linkTtlProperties;

  private MeterRegistry meterRegistry;

  @InjectMocks
  private CreateLinkServiceImpl service;

  @BeforeEach
  void setUp() {
    meterRegistry = new SimpleMeterRegistry();

    service = new CreateLinkServiceImpl(
        codeUtils,
        repository,
        meterRegistry,
        passwordEncoder,
        linkTtlProperties);
  }

  @Test
  @DisplayName("Deve criar link de redirecionamento com sucesso")
  void shouldCreateRedirectLink() {
    OffsetDateTime expiresAt = OffsetDateTime.now().plusHours(2);

    CreateLinkRequestDto request = new CreateLinkRequestDto(
        expiresAt,
        10,
        "https://example.com",
        null);

    when(codeUtils.generateUniqueShortCode())
        .thenReturn("abc123");
    when(codeUtils.generateAccessUrl("abc123"))
        .thenReturn("http://localhost/l/abc123");

    CreateLinkResponseDto response = service.create(request);

    assertNotNull(response);
    assertEquals("abc123", response.shortCode());
    assertEquals(expiresAt, response.expiresAt());

    verify(repository).save(any(SecureLink.class));
  }

  @Test
  @DisplayName("Deve usar TTL default quando expiresAt for nulo")
  void shouldUseDefaultTtlWhenExpiresAtIsNull() {
    when(codeUtils.generateUniqueShortCode())
        .thenReturn("ttl123");
    when(codeUtils.generateAccessUrl("ttl123"))
        .thenReturn("http://localhost/l/ttl123");
    when(linkTtlProperties.getDefaultTtl())
        .thenReturn(Duration.ofHours(24));

    CreateLinkRequestDto request = new CreateLinkRequestDto(
        null,
        5,
        "https://example.com",
        null);

    CreateLinkResponseDto response = service.create(request);

    assertNotNull(response);
    assertNotNull(response.expiresAt());

    verify(repository).save(any(SecureLink.class));
  }

  @Test
  @DisplayName("Deve criar link protegido por senha quando password for informado")
  void shouldCreatePasswordProtectedLink() {
    when(codeUtils.generateUniqueShortCode())
        .thenReturn("secure123");
    when(codeUtils.generateAccessUrl("secure123"))
        .thenReturn("http://localhost/l/secure123");
    when(passwordEncoder.encode("secret"))
        .thenReturn("hashed-secret");

    CreateLinkRequestDto request = new CreateLinkRequestDto(
        OffsetDateTime.now().plusHours(1),
        3,
        "https://secure.com",
        "secret");

    service.create(request);

    verify(passwordEncoder).encode("secret");
    verify(repository).save(argThat(
        SecureLink::isPasswordProtected));
  }

  @Test
  @DisplayName("Não deve proteger link quando password for nulo ou vazio")
  void shouldNotProtectLinkWhenPasswordIsBlank() {
    when(codeUtils.generateUniqueShortCode())
        .thenReturn("nopass");
    when(codeUtils.generateAccessUrl("nopass"))
        .thenReturn("http://localhost/l/nopass");

    CreateLinkRequestDto request = new CreateLinkRequestDto(
        OffsetDateTime.now().plusHours(1),
        3,
        "https://nopass.com",
        "   ");

    service.create(request);

    verify(passwordEncoder, never()).encode(any());
    verify(repository).save(any(SecureLink.class));
  }
}
