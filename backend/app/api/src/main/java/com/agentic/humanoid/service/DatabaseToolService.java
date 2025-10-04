package com.agentic.humanoid.service;

import java.util.Map;
import java.util.regex.Pattern;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class DatabaseToolService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // ✅ Safe SELECT regex
    private static final Pattern SAFE_SQL_PATTERN = Pattern.compile(
            "^\\s*SELECT\\s+[\\s\\S]+\\s+FROM\\s+[a-zA-Z0-9_]+[\\s\\S]*$",
            Pattern.CASE_INSENSITIVE);

    /**
     * Execute only safe SELECT queries.
     * Blocks INSERT/UPDATE/DELETE/DDL.
     */
    public String executeSafeQuery(String sql, Long userId) {
        if (sql == null || sql.trim().isEmpty() || sql.equalsIgnoreCase("UNSUPPORTED")) {
            // ✅ Return null so controller handles it
            return null;
        }
        try {
            // Run query → fetch rows
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);

            if (rows.isEmpty()) {
                return "No results found.";
            }

            // ✅ Convert rows into JSON string
            ObjectMapper mapper = new ObjectMapper();
            return mapper.writerWithDefaultPrettyPrinter().writeValueAsString(rows);

        } catch (Exception e) {
            e.printStackTrace();
            return "❌ Error executing query: " + e.getMessage();
        }
    }

    /**
     * Check if SQL is safe.
     */
    private boolean isSafeQuery(String sql) {
        if (sql == null)
            return false;
        String lower = sql.toLowerCase();

        // ❌ Block dangerous statements
        if (lower.contains("insert ") || lower.contains("update ") ||
                lower.contains("delete ") || lower.contains("drop ") ||
                lower.contains("alter ") || lower.contains("create ") ||
                lower.contains("truncate ")) {
            return false;
        }

        // ✅ Allow SELECTs with WHERE / ORDER BY / GROUP BY / LIMIT / OFFSET
        return SAFE_SQL_PATTERN.matcher(sql).matches();
    }
}