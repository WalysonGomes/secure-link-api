package br.com.walyson.secure_link.service;

import java.time.OffsetDateTime;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

import br.com.walyson.secure_link.domain.SecureLink;
import br.com.walyson.secure_link.dto.CreateLinkResponse;
import br.com.walyson.secure_link.repository.SecureLinkRepository;
import br.com.walyson.secure_link.service.impl.UploadLinkServiceImpl;
import br.com.walyson.secure_link.utils.CodeUtils;
import br.com.walyson.secure_link.utils.FileUtils;

@ExtendWith(MockitoExtension.class)
class UploadLinkServiceTest {

    @Mock
    private SecureLinkRepository repository;

    @Mock
    private CodeUtils codeUtils;

    @Mock
    private FileUtils fileUtils;

    @InjectMocks
    private UploadLinkServiceImpl service;

    @Test
    @DisplayName("Deve realizar upload e retornar response com sucesso")
    void shouldCreateLinkFromUpload() {
        MultipartFile file = new MockMultipartFile(
            "file", "test.txt", "text/plain", "content".getBytes()
        );
        OffsetDateTime expiresAt = OffsetDateTime.now().plusSeconds(3600);
        Integer maxViews = 3;

        when(codeUtils.generateUniqueShortCode()).thenReturn("abc12345");
        when(fileUtils.storeFile(any())).thenReturn("unique-file-name.txt");
        when(fileUtils.generateFilePath(anyString())).thenReturn("/storage/unique-file-name.txt");
        when(codeUtils.generateAccessUrl("abc12345")).thenReturn("http://localhost/l/abc12345");

        CreateLinkResponse response = service.upload(file, expiresAt, maxViews);

        assertNotNull(response);
        assertEquals("abc12345", response.shortCode());
        assertEquals("http://localhost/l/abc12345", response.accessUrl());

        verify(repository, times(1)).save(any(SecureLink.class));
    }

    @Test
    @DisplayName("Deve lançar exceção quando o arquivo estiver vazio")
    void shouldThrowExceptionWhenFileIsEmpty() {
        MultipartFile emptyFile = new MockMultipartFile("file", new byte[0]);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            service.upload(emptyFile, OffsetDateTime.now(), 1);
        });

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        assertEquals("File is required", exception.getReason());
    }
}
