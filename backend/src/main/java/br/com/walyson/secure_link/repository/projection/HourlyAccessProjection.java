package br.com.walyson.secure_link.repository.projection;

public interface HourlyAccessProjection {
    int getHour();
    long getCount();
}
