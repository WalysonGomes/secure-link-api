package br.com.walyson.secure_link.repository.projection;

public interface AccessSummaryProjection {
    Long getTotal();
    Long getSuccess();
    Long getFailed();
}
