package br.com.walyson.secure_link.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import br.com.walyson.secure_link.domain.SecureLink;

@Repository
public interface SecureLinkRepository extends JpaRepository<SecureLink, UUID> {

  Optional<SecureLink> findByShortCode(String shortCode);

  boolean existsByShortCode(String shortCode);

}
