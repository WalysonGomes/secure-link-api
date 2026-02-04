package br.com.walyson.secure_link.repository.projection;

import java.time.LocalDate;

public interface DailyAccessProjection {
    LocalDate getAccessDate();
    long getCount();
}
