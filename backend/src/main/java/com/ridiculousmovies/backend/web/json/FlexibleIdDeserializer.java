package com.ridiculousmovies.backend.web.json;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import java.io.IOException;

public class FlexibleIdDeserializer extends JsonDeserializer<String> {

  @Override
  public String deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
    JsonToken t = p.currentToken();
    if (t == JsonToken.VALUE_NUMBER_INT || t == JsonToken.VALUE_NUMBER_FLOAT) {
      return p.getNumberValue().toString();
    }
    if (t == JsonToken.VALUE_STRING) {
      String s = p.getText().trim();
      return s.isEmpty() ? null : s;
    }
    if (t == JsonToken.VALUE_NULL) {
      return null;
    }
    return p.getValueAsString();
  }
}
