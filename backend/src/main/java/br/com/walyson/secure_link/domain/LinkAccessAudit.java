package br.com.walyson.secure_link.domain;

import java.time.OffsetDateTime;
import java.util.UUID;

import br.com.walyson.secure_link.domain.enums.AccessResult;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "link_access_audit")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LinkAccessAudit {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "short_code", nullable = false, length = 20)
  private String shortCode;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 30)
  private AccessResult result;

  @Column(name = "ip_address", length = 45)
  private String ipAddress;

  @Column(name = "user_agent", length = 500)
  private String userAgent;

  @Column(name = "accessed_at", nullable = false)
  private OffsetDateTime accessedAt;
}
