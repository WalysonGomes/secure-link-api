ALTER TABLE secure_link
ADD COLUMN target_url VARCHAR(500) AFTER short_code;

