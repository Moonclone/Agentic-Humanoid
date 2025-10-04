package com.agentic.humanoid.DTO;

import java.time.LocalDateTime;

import com.agentic.humanoid.model.User;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class QueryResponseDTO {
    private Long id;
    private String queryText;
    private String responseText; // short AI message
    private Object responseData; // JSON results
    private LocalDateTime createdAt;
    private User user;
}