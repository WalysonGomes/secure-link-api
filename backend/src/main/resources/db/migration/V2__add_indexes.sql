CREATE INDEX IDX_secure_link_status_expires_at
ON secure_link (status, expires_at);

CREATE INDEX IDX_secure_link_short_code_status
ON secure_link (short_code, status);

