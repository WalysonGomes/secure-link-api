package br.com.walyson.secure_link.controller;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.walyson.secure_link.domain.enums.LinkStatus;
import br.com.walyson.secure_link.dto.stats.AccessByResultDto;
import br.com.walyson.secure_link.dto.stats.AccessSummaryDto;
import br.com.walyson.secure_link.dto.stats.DailyAccessDto;
import br.com.walyson.secure_link.dto.stats.HourlyAccessDto;
import br.com.walyson.secure_link.dto.stats.LinkStatusStatsDto;
import br.com.walyson.secure_link.dto.stats.SecurityExceptionDto;
import br.com.walyson.secure_link.dto.stats.TopLinkDto;
import br.com.walyson.secure_link.repository.LinkAccessAuditRepository;
import br.com.walyson.secure_link.repository.SecureLinkRepository;
import br.com.walyson.secure_link.repository.projection.LinkStatusCountProjection;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {
  private final LinkAccessAuditRepository repository;
  private final SecureLinkRepository secureLinkRepository;

  @GetMapping("/access/summary")
  public AccessSummaryDto summary() {
    var projection = repository.fetchAccessSummaryProjection();
    long uniqueOrigins = repository.countUniqueOrigins();

    return new AccessSummaryDto(
      projection.getTotal(), 
      projection.getSuccess(), 
      projection.getFailed(),
      projection.getExpired(),
      uniqueOrigins
    );
  }

  @GetMapping("/access/hourly")
  public List<HourlyAccessDto> hourly() {
    return repository.countHourlyAccesses().stream()
    .map(p -> new HourlyAccessDto(p.getHour(), p.getCount()))
    .toList();
  }

  @GetMapping("/security/exceptions")
  public List<SecurityExceptionDto> securityExceptions(@RequestParam(defaultValue = "5") int limit) {
    return repository.findTopSecurityExceptions(PageRequest.of(0, limit)).getContent().stream()
    .map(p -> new SecurityExceptionDto(p.getShortCode(), p.getCount()))
    .toList();
  }

  @GetMapping("/access/failures")
  public List<AccessByResultDto> failures() {
    return repository.countFailuresByResult().stream()
    .map(p -> new AccessByResultDto(p.getResult(), p.getCount()))
    .toList();
  }


  @GetMapping("/access/daily")
  public List<DailyAccessDto> daily() {
    return repository.countDailyAccesses().stream()
    .map(p -> new DailyAccessDto(p.getAccessDate(), p.getCount()))
    .toList();
  }

  @GetMapping("/links")
  public LinkStatusStatsDto linkStats() {

    List<LinkStatusCountProjection> data =
    secureLinkRepository.countLinksByStatus();

    Map<LinkStatus, Long> counts = data.stream()
    .collect(Collectors.toMap(
      LinkStatusCountProjection::getStatus,
      LinkStatusCountProjection::getCount
    ));

    return new LinkStatusStatsDto(
      counts.getOrDefault(LinkStatus.ACTIVE, 0L),
      counts.getOrDefault(LinkStatus.EXPIRED, 0L),
      counts.getOrDefault(LinkStatus.REVOKED, 0L)
    );
  }

  @GetMapping("/links/top")
  public List<TopLinkDto> topLinks(@RequestParam(defaultValue = "5") int limit) {
    return repository.findTopLinks(PageRequest.of(0, limit)).getContent().stream()
    .map(p -> new TopLinkDto(p.getShortCode(), p.getAccessCount()))
    .toList();
  }
}
