package com.ridiculousmovies.backend.store;

import java.io.IOException;

public interface StorageClient {
  String download(String fileId) throws IOException;
  void upload(String fileId, String json) throws IOException;
}
