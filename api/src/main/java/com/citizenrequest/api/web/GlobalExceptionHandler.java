package com.citizenrequest.api.web;

import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(RuntimeException.class)
  public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
    String message =
        (ex.getMessage() != null && !ex.getMessage().isBlank())
            ? ex.getMessage()
            : "An unexpected error occurred.";
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", message));
  }
}
