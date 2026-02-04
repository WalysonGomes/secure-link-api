package br.com.walyson.secure_link.repository.projection;

import br.com.walyson.secure_link.domain.enums.AccessResult;

public interface AccessByResultProjection {
    AccessResult getResult();
    long getCount();
}
