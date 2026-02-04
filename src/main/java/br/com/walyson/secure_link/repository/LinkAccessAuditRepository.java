package br.com.walyson.secure_link.repository;

import br.com.walyson.secure_link.domain.LinkAccessAudit;
import br.com.walyson.secure_link.repository.projection.AccessByResultProjection;
import br.com.walyson.secure_link.repository.projection.AccessSummaryProjection;
import br.com.walyson.secure_link.repository.projection.DailyAccessProjection;
import br.com.walyson.secure_link.repository.projection.TopLinkProjection;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface LinkAccessAuditRepository extends JpaRepository<LinkAccessAudit, UUID> {

  @Query("""
    select 
    count(a) as total, 
    sum(case when a.result = 'SUCCESS' then 1 else 0 end) as success, 
    sum(case when a.result <> 'SUCCESS' then 1 else 0 end) as failed 
    from LinkAccessAudit a
    """)
  AccessSummaryProjection fetchAccessSummaryProjection();

  @Query("""
    select a.result as result, count(a) as count
    from LinkAccessAudit a
    where a.result <> 'SUCCESS'
    group by a.result
    """)
  List<AccessByResultProjection> countFailuresByResult();

  @Query("""
    select a.shortCode as shortCode, count(a) as accessCount
    from LinkAccessAudit a
    where a.result = 'SUCCESS'
    group by a.shortCode
    order by count(a) desc
    """)
  Page<TopLinkProjection> findTopLinks(Pageable pageable);

  @Query("""
    select 
    cast(a.accessedAt as date) as accessDate, 
    count(a) as count
    from LinkAccessAudit a
    group by date(a.accessedAt)
    order by date(a.accessedAt)
    """)
  List<DailyAccessProjection> countDailyAccesses();
}
