CREATE TABLE link_access_audit (
  id BINARY(16) NOT NULL,
  short_code VARCHAR(20) NOT NULL,
  result VARCHAR(30) NOT NULL,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  accessed_at TIMESTAMP NOT NULL,
  PRIMARY KEY (id),
  INDEX idx_link_access_audit_short_code (short_code),
  INDEX idx_link_access_audit_result (result),
  INDEX idx_link_access_audit_accessed_at (accessed_at)
);

