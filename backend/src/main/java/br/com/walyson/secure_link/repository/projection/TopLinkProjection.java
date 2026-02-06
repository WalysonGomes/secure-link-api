package br.com.walyson.secure_link.repository.projection;

public interface TopLinkProjection {
    String getShortCode();
    long getAccessCount();
}
