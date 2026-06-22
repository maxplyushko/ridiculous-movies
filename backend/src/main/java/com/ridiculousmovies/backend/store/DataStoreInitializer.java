package com.ridiculousmovies.backend.store;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class DataStoreInitializer implements ApplicationRunner {

  private static final Logger log = LoggerFactory.getLogger(DataStoreInitializer.class);

  private final GoogleDriveClient driveClient;
  private final DataStore dataStore;
  private final String fileId;

  public DataStoreInitializer(
      GoogleDriveClient driveClient,
      DataStore dataStore,
      @Value("${google.drive.file-id}") String fileId
  ) {
    this.driveClient = driveClient;
    this.dataStore = dataStore;
    this.fileId = fileId;
  }

  @Override
  public void run(ApplicationArguments args) throws Exception {
    log.info("Loading data from Google Drive file: {}", fileId);
    String json = driveClient.download(fileId);
    dataStore.initialize(json);
    log.info("Data loaded successfully");
  }
}
