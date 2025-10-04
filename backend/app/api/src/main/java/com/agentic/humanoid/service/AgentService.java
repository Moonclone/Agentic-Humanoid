package com.agentic.humanoid.service;

import com.agentic.humanoid.component.LlmClient;
import com.agentic.humanoid.model.Queries;
import com.agentic.humanoid.model.User;
import com.agentic.humanoid.repository.QueryRepository;
import com.agentic.humanoid.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AgentService {

    private final QueryRepository queryRepository;
    private final UserRepository userRepository;
    private final LlmClient llmClient; // we'll create this wrapper next
    private final DatabaseTool databaseTool;

    public AgentService(QueryRepository queryRepository,
            UserRepository userRepository,
            LlmClient llmClient,
            DatabaseTool databaseTool) {
        this.queryRepository = queryRepository;
        this.userRepository = userRepository;
        this.llmClient = llmClient;
        this.databaseTool = databaseTool;
    }

    @Transactional
    public Queries handleUserQuery(Long userId, String question) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Step 1: Ask LLM if this should be a DB query
        String sql = llmClient.generateSql(question);

        String answer;
        if (sql != null) {
            String lowered = sql.toLowerCase();

            if (sql.equalsIgnoreCase("UNSUPPORTED") ||
                    lowered.contains("insert") ||
                    lowered.contains("update") ||
                    lowered.contains("delete") ||
                    lowered.contains("drop") ||
                    lowered.contains("alter") ||
                    lowered.contains("create") ||
                    lowered.contains("truncate")) {

                answer = "This type of query is not supported for safety reasons.";
            } else {
                answer = databaseTool.runQuery(sql);
            }
        } else {
            answer = llmClient.getAnswer(question);
        }

        // Step 3: Save query + response
        Queries query = new Queries();
        query.setUser(user);
        query.setQueryText(question);
        query.setResponseText(answer);
        query.setCreatedAt(LocalDateTime.now());

        return queryRepository.save(query);
    }

}
