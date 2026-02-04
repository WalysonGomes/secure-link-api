package br.com.walyson.secure_link.service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.OffsetDateTime;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import br.com.walyson.secure_link.domain.SecureLink;
import br.com.walyson.secure_link.domain.enums.AccessResult;
import br.com.walyson.secure_link.domain.enums.LinkType;
import br.com.walyson.secure_link.dto.AccessContextDto;
import br.com.walyson.secure_link.dto.ResolveResultDto;
import br.com.walyson.secure_link.repository.SecureLinkRepository;
import br.com.walyson.secure_link.service.impl.ResolveLinkServiceImpl;
import br.com.walyson.secure_link.utils.FileUtils;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;

@ExtendWith(MockitoExtension.class)
class ResolveLinkServiceTest {

  @Mock
  private SecureLinkRepository repository;

  @Mock
  private FileUtils fileUtils;

  @Mock
  private PasswordEncoder passwordEncoder;

  @Mock
  private LinkAccessAuditService auditService;

  private MeterRegistry meterRegistry;
  private ResolveLinkServiceImpl service;

  private final AccessContextDto context = new AccessContextDto("127.0.0.1", "JUnit");

  @BeforeEach
  void setUp() {
    meterRegistry = new SimpleMeterRegistry();

    service = new ResolveLinkServiceImpl(
        fileUtils,
        repository,
        meterRegistry,
        passwordEncoder,
        auditService);
  }

  @Test
  @DisplayName("Deve lançar 404 quando link não existir")
  void shouldThrowNotFoundWhenLinkDoesNotExist() {
    when(repository.findByShortCode("404"))
        .thenReturn(Optional.empty());

    ResponseStatusException ex = assertThrows(
        ResponseStatusException.class,
        () -> service.resolve("404", null, context));

    assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());

    verify(auditService)
        .audit("404", AccessResult.NOT_FOUND,
            context.ipAddress(), context.userAgent());
  }

  @Test
  @DisplayName("Deve lançar 410 quando link estiver revogado")
  void shouldThrowGoneWhenLinkIsRevoked() {
    SecureLink link = new SecureLink(
        "revoked",
        "https://example.com",
        OffsetDateTime.now().plusHours(1),
        5);
    link.revoke();

    when(repository.findByShortCode("revoked"))
        .thenReturn(Optional.of(link));

    ResponseStatusException ex = assertThrows(
        ResponseStatusException.class,
        () -> service.resolve("revoked", null, context));

    assertEquals(HttpStatus.GONE, ex.getStatusCode());

    verify(auditService)
        .audit("revoked", AccessResult.REVOKED,
            context.ipAddress(), context.userAgent());
  }

  @Test
  @DisplayName("Deve lançar 401 quando senha for requerida e não informada")
  void shouldRequirePassword() {
    SecureLink link = new SecureLink(
        "secure",
        "https://secure.com",
        OffsetDateTime.now().plusHours(1),
        3);
    link.protectWithPassword("hash");

    when(repository.findByShortCode("secure"))
        .thenReturn(Optional.of(link));

    ResponseStatusException ex = assertThrows(
        ResponseStatusException.class,
        () -> service.resolve("secure", null, context));

    assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());

    verify(auditService)
        .audit("secure", AccessResult.PASSWORD_REQUIRED,
            context.ipAddress(), context.userAgent());
  }

  @Test
  @DisplayName("Deve lançar 401 quando senha for inválida")
  void shouldRejectInvalidPassword() {
    SecureLink link = new SecureLink(
        "secure",
        "https://secure.com",
        OffsetDateTime.now().plusHours(1),
        3);
    link.protectWithPassword("hashed");

    when(repository.findByShortCode("secure"))
        .thenReturn(Optional.of(link));

    when(passwordEncoder.matches("wrong", "hashed"))
        .thenReturn(false);

    ResponseStatusException ex = assertThrows(
        ResponseStatusException.class,
        () -> service.resolve("secure", "wrong", context));

    assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());

    verify(auditService)
        .audit("secure", AccessResult.INVALID_PASSWORD,
            context.ipAddress(), context.userAgent());
  }

  @Test
  @DisplayName("Deve lançar 410 quando limite de visualizações for atingido")
  void shouldDenyWhenViewLimitReached() {
    SecureLink link = new SecureLink(
        "limit",
        "https://example.com",
        OffsetDateTime.now().plusHours(1),
        1);

    link.incrementViewCount();

    when(repository.findByShortCode("limit"))
        .thenReturn(Optional.of(link));

    ResponseStatusException ex = assertThrows(
        ResponseStatusException.class,
        () -> service.resolve("limit", null, context));

    assertEquals(HttpStatus.GONE, ex.getStatusCode());

    verify(repository).save(link);
    verify(auditService)
        .audit("limit", AccessResult.VIEW_LIMIT_REACHED,
            context.ipAddress(), context.userAgent());
  }

  @Test
  @DisplayName("Deve lançar 404 quando arquivo não existir")
  void shouldThrowNotFoundWhenFileIsMissing() {
    SecureLink link = new SecureLink(
        "file404",
        "/tmp/does-not-exist.txt",
        "file.txt",
        OffsetDateTime.now().plusHours(1),
        3);

    when(repository.findByShortCode("file404"))
        .thenReturn(Optional.of(link));

    ResponseStatusException ex = assertThrows(
        ResponseStatusException.class,
        () -> service.resolve("file404", null, context));

    assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
  }

  @Test
  @DisplayName("Deve resolver link de download com sucesso")
  void shouldResolveDownloadLink() throws Exception {
    Path file = Files.createTempFile("test", ".txt");

    SecureLink link = new SecureLink(
        "file",
        file.toString(),
        "file.txt",
        OffsetDateTime.now().plusHours(1),
        2);

    Resource resource = mock(Resource.class);

    when(repository.findByShortCode("file"))
        .thenReturn(Optional.of(link));

    when(fileUtils.getResource(file.toString()))
        .thenReturn(resource);

    ResolveResultDto result = service.resolve("file", null, context);

    assertEquals(LinkType.DOWNLOAD, result.type());
    assertEquals("file.txt", result.originalFilename());

    verify(repository).save(link);
    verify(auditService)
        .audit("file", AccessResult.SUCCESS,
            context.ipAddress(), context.userAgent());
  }
}
