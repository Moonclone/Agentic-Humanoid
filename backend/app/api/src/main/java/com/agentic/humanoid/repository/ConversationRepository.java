package com.agentic.humanoid.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.agentic.humanoid.model.Conversation;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    List<Conversation> findByUserId(Long userId);
}
