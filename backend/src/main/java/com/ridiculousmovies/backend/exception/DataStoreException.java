package com.ridiculousmovies.backend.exception;

import java.io.Serial;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@SuppressWarnings("unused")
public class DataStoreException extends RuntimeException {

  @Serial
  private static final long serialVersionUID = -7034897190745766939L;

  public DataStoreException(String message) {
    super(message);
  }

  public DataStoreException(String message, Throwable cause) {
    super(message, cause);
  }

  public DataStoreException(Throwable cause) {
    super(cause);
  }
}
