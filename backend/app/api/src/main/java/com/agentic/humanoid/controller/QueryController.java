package com.agentic.humanoid.controller;

import com.agentic.humanoid.component.LlmClient;
import com.agentic.humanoid.model.Conversation;
import com.agentic.humanoid.model.ConversationMessage;
import com.agentic.humanoid.model.ConversationMessageRepository;
import com.agentic.humanoid.model.Queries;
import com.agentic.humanoid.model.User;
import com.agentic.humanoid.repository.ConversationRepository;
import com.agentic.humanoid.repository.QueryRepository;
import com.agentic.humanoid.repository.UserRepository;
import com.agentic.humanoid.service.DatabaseToolService;

import java.util.HashMap;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/queries")
public class QueryController {

    private final QueryRepository queryRepository;
    private final UserRepository userRepository;
    private final DatabaseToolService databaseToolService;
    private final LlmClient llmClient;
    private final ConversationRepository conversationRepository;
    private final ConversationMessageRepository messageRepository;

    public QueryController(QueryRepository queryRepository,
            UserRepository userRepository,
            DatabaseToolService databaseToolService,
            LlmClient llmClient,
            ConversationRepository conversationRepository,
            ConversationMessageRepository messageRepository) {
        this.queryRepository = queryRepository;
        this.userRepository = userRepository;
        this.databaseToolService = databaseToolService;
        this.llmClient = llmClient;
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
    }

    @PostMapping("/ask")
    public ResponseEntity<Map<String, Object>> askQuestion(
            @RequestParam Long userId,
            @RequestParam String question,
            @RequestParam(required = false) Long conversationId) {

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
        }
        User user = userOpt.get();

        // 🔹 Step 1: Ensure conversation exists
        Conversation conversation;
        if (conversationId == null) {
            conversation = new Conversation();
            conversation.setUserId(userId);
            conversation.setTitle("Conversation started at " + LocalDateTime.now());
            conversation = conversationRepository.save(conversation);
        } else {
            conversation = conversationRepository.findById(conversationId)
                    .orElseThrow(() -> new RuntimeException("Conversation not found"));
        }

        // 🔹 Step 2: Save user message
        ConversationMessage userMsg = new ConversationMessage();
        userMsg.setConversationId(conversation.getId());
        userMsg.setRole("user");
        userMsg.setContent(question);
        messageRepository.save(userMsg);

        // 🔹 Step 3: Build context from history
        List<ConversationMessage> history = messageRepository
                .findByConversationIdOrderByCreatedAtAsc(conversation.getId());

        // 🔹 Step 4: Ask LLM for SQL
        List<Queries> historyEntities = queryRepository.findByUserIdOrderByCreatedAtAsc(userId);

        for (Queries q : historyEntities) {
            ConversationMessage userHistoryMsg = new ConversationMessage();
            userHistoryMsg.setRole("user");
            userHistoryMsg.setContent(q.getQueryText());
            history.add(userHistoryMsg);

            ConversationMessage assistantHistoryMsg = new ConversationMessage();
            assistantHistoryMsg.setRole("assistant");
            assistantHistoryMsg.setContent(q.getResponseText());
            history.add(assistantHistoryMsg);
        }

        // Now generate SQL with context
        String sql = llmClient.generateSqlWithContext(question, history, userId);

        // 🔹 Step 5: Save SQL message
        ConversationMessage sqlMsg = new ConversationMessage();
        sqlMsg.setConversationId(conversation.getId());
        sqlMsg.setRole("sql");
        sqlMsg.setContent(sql);
        messageRepository.save(sqlMsg);

        // 🔹 Step 6: Execute SQL safely
        String response;
        if (sql == null || sql.equalsIgnoreCase("UNSUPPORTED")) {
            response = "I can only answer safe database-related questions. " +
                    "Examples:\n- How many users are there?\n" +
                    "- What was the first question asked by User 1?\n" +
                    "- Show me all reports for User 2.";
        } else {
            response = databaseToolService.executeSafeQuery(sql, userId);
        }

        // 🔹 Step 7: Save assistant response
        ConversationMessage assistantMsg = new ConversationMessage();
        assistantMsg.setConversationId(conversation.getId());
        assistantMsg.setRole("assistant");
        assistantMsg.setContent(response);
        messageRepository.save(assistantMsg);

        // 🔹 Step 8: Also store in legacy Queries table (if you want to keep it)
        Queries query = new Queries();
        query.setUser(user);
        query.setQueryText(question);
        query.setResponseText(response);
        queryRepository.save(query);

        // 🔹 Step 9: Return response
        return ResponseEntity.ok(Map.of(
                "conversationId", conversation.getId(),
                "question", question,
                "sql", sql,
                "answer", response));
    }

    /**
     * Fetch chat history
     */

    @GetMapping("/history")
    public ResponseEntity<List<Map<String, Object>>> getHistory(@RequestParam Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(null);
        }

        List<Queries> history = queryRepository.findByUserIdOrderByCreatedAtAsc(userId);

        // Convert into Chat-like format
        List<Map<String, Object>> chatHistory = history.stream().map(q -> {
            Map<String, Object> entry = new HashMap<>();
            entry.put("question", q.getQueryText());
            entry.put("answer", q.getResponseText());
            entry.put("timestamp", q.getCreatedAt());
            return entry;
        }).toList();

        return ResponseEntity.ok(chatHistory);
    }
}
