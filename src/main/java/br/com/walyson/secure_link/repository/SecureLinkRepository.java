package br.com.walyson.secure_link.repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import br.com.walyson.secure_link.repository.projection.LinkStatusCountProjection;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import br.com.walyson.secure_link.domain.SecureLink;

@Repository
public interface SecureLinkRepository extends JpaRepository<SecureLink, UUID> {

  Optional<SecureLink> findByShortCode(String shortCode);

  boolean existsByShortCode(String shortCode);

  @Query("""
    SELECT l
    FROM SecureLink l
    WHERE l.status = 'ACTIVE'
    AND (
    (l.expiresAt IS NOT NULL AND l.expiresAt <= :now)
    OR
    (l.maxViews IS NOT NULL AND l.viewCount >= l.maxViews)
    )
    """)
  List<SecureLink> findLinksToExpire(@Param("now") OffsetDateTime now);


  @Query("""
    select l.status as status, count(l) as count
    from SecureLink l
    group by l.status
    """)
  List<LinkStatusCountProjection> countLinksByStatus();

}
