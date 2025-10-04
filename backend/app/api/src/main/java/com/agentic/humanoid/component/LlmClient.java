package com.agentic.humanoid.component;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import com.agentic.humanoid.model.ConversationMessage;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class LlmClient {

    private static final String API_URL = "https://api.perplexity.ai/chat/completions";
    private static final String MODEL = "sonar-pro"; // Perplexity Sonar model

    // Load your Perplexity API key from application.properties or env
    @Value("${perplexity.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public String getAnswer(String question) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            Map<String, Object> requestBody = Map.of(
                    "model", MODEL,
                    "messages", new Object[] {
                            Map.of("role", "system", "content",
                                    "You are an intelligent agent that helps users query databases, Jira, and reports."),
                            Map.of("role", "user", "content", question)
                    });

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            Map<String, Object> response = (Map<String, Object>) restTemplate.postForObject(API_URL, entity, Map.class);

            if (response != null && response.containsKey("choices")) {
                Map firstChoice = ((List<Map>) response.get("choices")).get(0);
                Map message = (Map) firstChoice.get("message");
                return message.get("content").toString().trim();
            }

            return "Sorry, I could not generate a response.";
        } catch (Exception e) {
            e.printStackTrace();
            return "Error contacting LLM: " + e.getMessage();
        }
    }

    /**
     * SQL Generator (strict safe SELECT queries only)
     */
    public String generateSql(String question) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            Map<String, Object> requestBody = Map.of(
                    "model", MODEL,
                    "messages", new Object[] {
                            Map.of("role", "system", "content",
                                    "You are an expert SQL generator. " +
                                            "Convert natural language questions into SQL queries for a PostgreSQL database. \n\n"
                                            +
                                            "STRICT RULES:\n" +
                                            "- Only generate safe SELECT queries.\n" +
                                            "- Allowed: WHERE filters, ORDER BY, LIMIT, GROUP BY, aggregations (COUNT, SUM, etc.), safe joins.\n"
                                            +
                                            "- Forbidden: INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, TRUNCATE, or any DDL/DML.\n"
                                            +
                                            "- If impossible with a SELECT query, respond only with: UNSUPPORTED.\n\n" +
                                            "Database schema:\n" +
                                            "users(id SERIAL, username VARCHAR, email VARCHAR, role VARCHAR, created_at TIMESTAMP)\n"
                                            +
                                            "queries(id SERIAL, user_id INT, query_text TEXT, response_text TEXT, created_at TIMESTAMP)\n"
                                            +
                                            "reports(id SERIAL, user_id INT, report_name VARCHAR, report_file VARCHAR, created_at TIMESTAMP)\n"
                                            +
                                            "audit_logs(id SERIAL, user_id INT, action VARCHAR, metadata JSONB, created_at TIMESTAMP)\n\n"
                                            +
                                            "Interpretation:\n" +
                                            "- 'User <number>' → users.id = <number>\n" +
                                            "- 'User <name>' → users.username = '<name>' (case-insensitive)\n" +
                                            "- To fetch questions asked by a user → select from queries table using queries.user_id.\n\n"
                                            +
                                            "Examples:\n" +
                                            "Q: How many users are there?\n" +
                                            "SQL: SELECT COUNT(*) FROM users;\n\n" +
                                            "Q: What was the first question asked by User 1?\n" +
                                            "SQL: SELECT query_text FROM queries WHERE user_id = 1 ORDER BY created_at ASC LIMIT 1;\n\n"
                                            +
                                            "Q: Find questions asked by User 3.\n" +
                                            "SQL: SELECT query_text FROM queries WHERE user_id = 3 ORDER BY created_at ASC;\n\n"
                                            +
                                            "Q: Find questions asked by Alice.\n" +
                                            "SQL: SELECT q.query_text FROM queries q JOIN users u ON q.user_id = u.id WHERE LOWER(u.username) = 'alice' ORDER BY q.created_at ASC;\n\n"
                                            +
                                            "Always output only the SQL query, no explanations, no markdown."),
                            Map.of("role", "user", "content", question)
                    });

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            Map<String, Object> response = restTemplate.postForObject(API_URL, entity, Map.class);

            if (response != null && response.containsKey("choices")) {
                Map firstChoice = ((List<Map>) response.get("choices")).get(0);
                Map message = (Map) firstChoice.get("message");
                String sql = message.get("content").toString().trim();
                return sql.replace("```sql", "").replace("```", "").trim();
            }

            return "UNSUPPORTED";
        } catch (Exception e) {
            e.printStackTrace();
            return "UNSUPPORTED";
        }
    }

    /**
     * SQL Generator with chat history context (Phase 1 & beyond)
     */
    @SuppressWarnings("unchecked")
    public String generateSqlWithContext(String question, List<ConversationMessage> history, Long userId) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            List<Map<String, String>> messages = new ArrayList<>();

            // ✅ System instruction (must be first)
            messages.add(Map.of("role", "system", "content",
                    "You are an expert SQL generator. Convert natural language questions into SQL queries for a PostgreSQL database.\n\n"
                            + "STRICT RULES:\n"
                            + "- Only generate safe SELECT queries.\n"
                            + "- Allowed operations: WHERE filters, ORDER BY, LIMIT, GROUP BY, aggregations (COUNT, SUM, etc.), and safe joins.\n"
                            + "- Forbidden: INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, TRUNCATE, or any DDL/DML.\n"
                            + "- If truly impossible with a SELECT query, respond only with: UNSUPPORTED.\n\n"
                            + "Interpretation rules:\n"
                            + "- The phrase 'I' or 'me' always refers to the current user with id = " + userId + ".\n"
                            + "- 'User <number>' means users.id = <number>.\n"
                            + "- 'User <name>' means users.username = '<name>' (case-insensitive).\n"
                            + "- To fetch questions asked by a user, select from the queries table using queries.user_id.\n\n"
                            + "Database schema:\n"
                            + "users(id SERIAL, username VARCHAR, email VARCHAR, role VARCHAR, created_at TIMESTAMP)\n"
                            + "queries(id SERIAL, user_id INT, query_text TEXT, response_text TEXT, created_at TIMESTAMP)\n"
                            + "reports(id SERIAL, user_id INT, report_name VARCHAR, report_file VARCHAR, created_at TIMESTAMP)\n"
                            + "audit_logs(id SERIAL, user_id INT, action VARCHAR, metadata JSONB, created_at TIMESTAMP)\n\n"
                            + "Examples:\n"
                            + "- Question: 'Show me all questions I have asked.'\n"
                            + "  SQL: SELECT query_text FROM queries WHERE user_id = " + userId
                            + " ORDER BY created_at ASC;\n\n"
                            + "Always output only the SQL query, no explanations, no markdown."));

            // ✅ Add conversation history (ensure alternation)
            String lastRole = "system";
            for (ConversationMessage msg : history) {
                if (lastRole.equals(msg.getRole())) {
                    System.out.println("⚠️ Skipping duplicate role in history: " + msg.getRole());
                    continue; // skip duplicates to avoid API 400 error
                }
                messages.add(Map.of("role", msg.getRole(), "content", msg.getContent()));
                lastRole = msg.getRole();
            }

            // ✅ Add current user question only if last isn't already "user"
            if (!"user".equals(lastRole)) {
                messages.add(Map.of("role", "user", "content", question));
            }

            Map<String, Object> requestBody = Map.of(
                    "model", MODEL,
                    "messages", messages);

            // ✅ Debug print request JSON
            ObjectMapper mapper = new ObjectMapper();
            System.out.println("➡️ Sending to LLM: " + mapper.writeValueAsString(requestBody));

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            Map<String, Object> response = restTemplate.postForObject(API_URL, entity, Map.class);

            if (response != null && response.containsKey("choices")) {
                Map firstChoice = ((List<Map>) response.get("choices")).get(0);
                Map message = (Map) firstChoice.get("message");
                String sql = message.get("content").toString().trim();

                // ✅ Debug log response
                System.out.println("⬅️ RAW LLM SQL RESPONSE: " + sql);

                return sql.replace("```sql", "").replace("```", "").trim();
            }

            return "UNSUPPORTED";
        } catch (Exception e) {
            e.printStackTrace();
            return "UNSUPPORTED";
        }
    }

}
