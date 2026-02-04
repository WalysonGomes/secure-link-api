package br.com.walyson.secure_link.domain.enums;

public enum AccessResult {
  SUCCESS,
  NOT_FOUND,
  REVOKED,
  EXPIRED,
  VIEW_LIMIT_REACHED,
  PASSWORD_REQUIRED,
  INVALID_PASSWORD,
  UNEXPECTED_STATE
}
