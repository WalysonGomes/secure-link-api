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

import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

import br.com.walyson.secure_link.domain.SecureLink;
import br.com.walyson.secure_link.dto.CreateLinkResponseDto;
import br.com.walyson.secure_link.repository.SecureLinkRepository;
import br.com.walyson.secure_link.service.impl.UploadLinkServiceImpl;
import br.com.walyson.secure_link.utils.CodeUtils;
import br.com.walyson.secure_link.utils.FileUtils;
import br.com.walyson.secure_link.config.LinkTtlProperties;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;

@ExtendWith(MockitoExtension.class)
class UploadLinkServiceTest {

  @Mock
  private SecureLinkRepository repository;

  @Mock
  private CodeUtils codeUtils;

  @Mock
  private FileUtils fileUtils;

  @Mock
  private PasswordEncoder passwordEncoder;

  @Mock
  private LinkTtlProperties linkTtlProperties;

  private MeterRegistry meterRegistry;

  @InjectMocks
  private UploadLinkServiceImpl service;

  @BeforeEach
  void setUp() {
    meterRegistry = new SimpleMeterRegistry();

    service = new UploadLinkServiceImpl(
        codeUtils,
        fileUtils,
        repository,
        meterRegistry,
        passwordEncoder,
        linkTtlProperties);
  }

  @Test
  @DisplayName("Deve realizar upload de arquivo e criar link com sucesso")
  void shouldCreateLinkFromUpload() {
    MultipartFile file = new MockMultipartFile(
        "file",
        "test.txt",
        "text/plain",
        "content".getBytes());

    OffsetDateTime expiresAt = OffsetDateTime.now().plusHours(1);
    Integer maxViews = 3;

    when(codeUtils.generateUniqueShortCode()).thenReturn("abc123");
    when(fileUtils.storeFile(any())).thenReturn("stored.txt");
    when(fileUtils.generateFilePath("stored.txt"))
        .thenReturn("/storage/stored.txt");
    when(codeUtils.generateAccessUrl("abc123"))
        .thenReturn("http://localhost/l/abc123");

    CreateLinkResponseDto response = service.upload(file, expiresAt, maxViews, null);

    assertNotNull(response);
    assertEquals("abc123", response.shortCode());
    assertEquals(maxViews, response.maxViews());

    verify(repository).save(any(SecureLink.class));
  }

  @Test
  @DisplayName("Deve lançar 400 quando arquivo estiver vazio")
  void shouldThrowBadRequestWhenFileIsEmpty() {
    MultipartFile emptyFile = new MockMultipartFile("file", new byte[0]);

    ResponseStatusException ex = assertThrows(
        ResponseStatusException.class,
        () -> service.upload(emptyFile, null, 1, null));

    assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
    assertEquals("File is required", ex.getReason());

    verify(repository, never()).save(any());
  }

  @Test
  @DisplayName("Deve usar TTL default quando expiresAt for nulo")
  void shouldUseDefaultTtlWhenExpiresAtIsNull() {
    MultipartFile file = new MockMultipartFile(
        "file",
        "test.txt",
        "text/plain",
        "content".getBytes());

    when(codeUtils.generateUniqueShortCode()).thenReturn("ttl123");
    when(fileUtils.storeFile(any())).thenReturn("stored.txt");
    when(fileUtils.generateFilePath("stored.txt"))
        .thenReturn("/storage/stored.txt");
    when(codeUtils.generateAccessUrl("ttl123"))
        .thenReturn("http://localhost/l/ttl123");
    when(linkTtlProperties.getDefaultTtl())
        .thenReturn(Duration.ofHours(24));

    CreateLinkResponseDto response = service.upload(file, null, 5, null);

    assertNotNull(response);
    assertNotNull(response.expiresAt());

    verify(repository).save(any(SecureLink.class));
  }

  @Test
  @DisplayName("Deve criar link protegido por senha quando password for informado")
  void shouldCreatePasswordProtectedLink() {
    MultipartFile file = new MockMultipartFile(
        "file",
        "test.txt",
        "text/plain",
        "content".getBytes());

    when(codeUtils.generateUniqueShortCode()).thenReturn("secure123");
    when(fileUtils.storeFile(any())).thenReturn("stored.txt");
    when(fileUtils.generateFilePath("stored.txt"))
        .thenReturn("/storage/stored.txt");
    when(codeUtils.generateAccessUrl("secure123"))
        .thenReturn("http://localhost/l/secure123");
    when(passwordEncoder.encode("secret"))
        .thenReturn("hashed-secret");

    service.upload(file, OffsetDateTime.now().plusHours(1), 2, "secret");

    verify(passwordEncoder).encode("secret");
    verify(repository).save(argThat(
        SecureLink::isPasswordProtected));
  }
}
