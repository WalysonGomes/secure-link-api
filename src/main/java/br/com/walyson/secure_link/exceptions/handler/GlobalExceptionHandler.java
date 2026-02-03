package br.com.walyson.secure_link.exceptions.handler;

import java.time.OffsetDateTime;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import br.com.walyson.secure_link.dto.error.ApiErrorDto;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiErrorDto> handleGenericException(
    Exception ex,
    HttpServletRequest request
  ) {
    String errorId = UUID.randomUUID().toString();

    log.error(
      "Internal server error | errorId={} | path={}",
      errorId,
      request.getRequestURI(),
      ex
    );

    HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;

    ApiErrorDto error = new ApiErrorDto(
      OffsetDateTime.now(),
      status.value(),
      status.getReasonPhrase(), 
      "An unexpected error occurred. Reference ID: " + errorId,
      request.getRequestURI()
    );

    return ResponseEntity.status(status).body(error);
  }


  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiErrorDto> handleValidationException(
    MethodArgumentNotValidException ex,
    HttpServletRequest request
  ) {
    String message = ex.getBindingResult()
    .getFieldErrors()
    .stream()
    .map(err -> err.getField() + ": " + err.getDefaultMessage())
    .findFirst()
    .orElse("Validation error");

    HttpStatus status = HttpStatus.BAD_REQUEST;

    ApiErrorDto error = new ApiErrorDto(
      OffsetDateTime.now(),
      status.value(),
      status.getReasonPhrase(), 
      message,
      request.getRequestURI()
    );

    return ResponseEntity.status(status).body(error);
  }


  @ExceptionHandler(ResponseStatusException.class)
  public ResponseEntity<ApiErrorDto> handleResponseStatusException(
    ResponseStatusException ex,
    HttpServletRequest request
  ) {
    int statusCode = ex.getStatusCode().value();

    String reasonPhrase = (ex.getStatusCode() instanceof HttpStatus statusEnum) 
    ? statusEnum.getReasonPhrase()
    : "HTTP Status " + statusCode;

    ApiErrorDto error = new ApiErrorDto(
      OffsetDateTime.now(),
      statusCode,
      reasonPhrase,
      ex.getReason(),
      request.getRequestURI()
    );

    return ResponseEntity.status(statusCode).body(error);
  }
}
