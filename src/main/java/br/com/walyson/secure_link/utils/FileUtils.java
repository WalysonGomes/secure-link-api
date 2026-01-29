package br.com.walyson.secure_link.utils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Component
public class FileUtils {

  @Value("${app.storage.path}")
  private String storagePath;

  public String generateFilePath(String filename) {
    return storagePath + filename;
  }

  public String storeFile(MultipartFile file) {
    try {
      Files.createDirectories(Paths.get(storagePath));
      String extension = getExtension(file.getOriginalFilename());
      String filename = UUID.randomUUID() + extension;

      Files.copy(file.getInputStream(), Paths.get(storagePath).resolve(filename));
      return filename;
    } catch (IOException e) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "File error", e);
    }
  }

  private String getExtension(String filename) {
    return Optional.ofNullable(filename)
    .filter(f -> f.contains("."))
    .map(f -> f.substring(f.lastIndexOf(".")))
    .orElse("");
  }

}
