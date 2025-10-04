package com.agentic.humanoid.repository;

import com.agentic.humanoid.model.Queries;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface QueryRepository extends JpaRepository<Queries, Long> {

    List<Queries> findByUserIdOrderByCreatedAtAsc(Long userId);
}
