package com.ridiculousmovies.backend.store;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.InputStreamContent;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.DriveScopes;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("prod")
public class GoogleDriveClient implements StorageClient {

  private final Drive drive;

  public GoogleDriveClient() {
    try {
      String credentialsJson = System.getenv("GOOGLE_CREDENTIALS_JSON");
      GoogleCredentials credentials;
      if (credentialsJson != null && !credentialsJson.isBlank()) {
        byte[] decoded = Base64.getDecoder().decode(credentialsJson.trim());
        credentials = GoogleCredentials.fromStream(new ByteArrayInputStream(decoded));
      } else {
        credentials = GoogleCredentials.getApplicationDefault();
      }
      credentials = credentials.createScoped(List.of(DriveScopes.DRIVE));
      this.drive = new Drive.Builder(
          GoogleNetHttpTransport.newTrustedTransport(),
          GsonFactory.getDefaultInstance(),
          new HttpCredentialsAdapter(credentials)
      ).setApplicationName("ridiculous-movies").build();
    } catch (Exception e) {
      throw new IllegalStateException("Failed to initialize Google Drive client", e);
    }
  }

  public String download(String fileId) throws IOException {
    try (InputStream is = drive.files().get(fileId).executeMediaAsInputStream()) {
      return new String(is.readAllBytes(), StandardCharsets.UTF_8);
    }
  }

  public void upload(String fileId, String json) throws IOException {
    byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
    InputStreamContent content = new InputStreamContent("application/json",
        new ByteArrayInputStream(bytes));
    content.setLength(bytes.length);
    drive.files().update(fileId, null, content).execute();
  }
}
