package br.com.walyson.secure_link.repository.projection;

import br.com.walyson.secure_link.domain.enums.LinkStatus;

public interface LinkStatusCountProjection {
  LinkStatus getStatus();
  Long getCount();
}

