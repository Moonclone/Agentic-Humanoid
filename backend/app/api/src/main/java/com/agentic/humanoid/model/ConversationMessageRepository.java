package com.agentic.humanoid.model;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ConversationMessageRepository extends JpaRepository<ConversationMessage, Long> {
    List<ConversationMessage> findByConversationIdOrderByCreatedAtAsc(Long conversationId);
}