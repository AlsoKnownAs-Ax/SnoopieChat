package com.snoopiechat.backend.dto.client;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserClientDto {
    private Long id;
    private String username;
    private String email;
}
