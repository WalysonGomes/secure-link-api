CREATE TABLE `secure_link` (
  `id` BINARY(16) NOT NULL,
  `short_code` VARCHAR(20) NOT NULL,
  `file_path` VARCHAR(500) DEFAULT NULL,
  `original_file_name` VARCHAR(255) DEFAULT NULL,
  `expires_at` DATETIME(6) DEFAULT NULL,
  `max_views` INT DEFAULT NULL,
  `view_count` INT NOT NULL,
  `status` ENUM ('ACTIVE','EXPIRED','REVOKED') NOT NULL,
  `created_at` DATETIME(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_secure_link_short_code` (`short_code`)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
