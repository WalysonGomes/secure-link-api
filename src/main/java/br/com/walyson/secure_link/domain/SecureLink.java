package br.com.walyson.secure_link.domain;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "secure_link")
@Data
@NoArgsConstructor
public class SecureLink {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "short_code", nullable = false, unique = true, length = 20)
  private String shortCode;

  @Column(name = "file_path", length = 500)
  private String filePath;

  @Column(name = "original_file_name")
  private String originalFileName;

  @Column(name = "expires_at")
  private Instant expiresAt;

  @Column(name = "max_views")
  private Integer maxViews; 

  @Column(name = "view_count", nullable = false)
  private Integer viewCount = 0;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private LinkStatus status = LinkStatus.ACTIVE;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt = Instant.now();

  public SecureLink(
    String shortCode,
    String filePath,
    String originalFileName,
    Instant expiresAt,
    Integer maxViews
  ) {
    this.shortCode = shortCode;
    this.filePath = filePath;
    this.originalFileName = originalFileName;
    this.expiresAt = expiresAt;
    this.maxViews = maxViews;
  }

  public boolean isExpired() {
    if (expiresAt == null) {
      return false;
    }
    boolean expired = Instant.now().isAfter(expiresAt);
    if (expired) {
      expire();
    }

    return expired;
  }

  public boolean hasReachedViewLimit() {
    return maxViews != null && viewCount >= maxViews;
  }

  public void incrementViewCount() {
    this.viewCount++;
    if (hasReachedViewLimit()) {
      expire();
    }
  }

  public void expire() {
    this.status = LinkStatus.EXPIRED;
  }
}
