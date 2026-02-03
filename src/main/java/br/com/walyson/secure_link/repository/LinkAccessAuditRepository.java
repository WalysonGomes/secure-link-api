package br.com.walyson.secure_link.repository;

import br.com.walyson.secure_link.domain.LinkAccessAudit;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LinkAccessAuditRepository extends JpaRepository<LinkAccessAudit, UUID> {

}
