package com.ridiculousmovies.backend.store;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("dev")
public class LocalFileStorageClient implements StorageClient {

  private static final Logger log = LoggerFactory.getLogger(LocalFileStorageClient.class);

  private final Path filePath;

  public LocalFileStorageClient(@Value("${storage.local.file-path}") String filePath) {
    this.filePath = Path.of(filePath).toAbsolutePath().normalize();
    log.info("LocalFileStorageClient using file: {}", this.filePath);
  }

  @Override
  public String download(String fileId) throws IOException {
    return Files.readString(filePath, StandardCharsets.UTF_8);
  }

  @Override
  public void upload(String fileId, String json) throws IOException {
    Files.writeString(filePath, json, StandardCharsets.UTF_8);
    log.debug("Persisted to local file: {}", filePath);
  }
}
