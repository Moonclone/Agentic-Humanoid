package com.agentic.humanoid.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "queries")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Queries {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "query_text", columnDefinition = "TEXT")
    private String queryText;

    // Keep this only for small messages like "Success" or "Error..."

    @Column(columnDefinition = "TEXT")
    @JdbcTypeCode(SqlTypes.VARCHAR)
    private String responseText;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
