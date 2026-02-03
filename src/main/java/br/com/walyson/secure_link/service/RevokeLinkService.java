package br.com.walyson.secure_link.service;

public interface RevokeLinkService {
  void revoke(String shortCode);
}
