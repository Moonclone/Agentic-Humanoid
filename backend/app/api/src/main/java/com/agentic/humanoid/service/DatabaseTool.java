package com.agentic.humanoid.service;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import javax.sql.DataSource;

import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class DatabaseTool {

    private final DataSource dataSource;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public DatabaseTool(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public String runQuery(String sql) {
        try {
            String lowered = sql.toLowerCase();

            // 🚫 Strictly block DDL & DML
            if (lowered.contains("insert") ||
                    lowered.contains("update") ||
                    lowered.contains("delete") ||
                    lowered.contains("drop") ||
                    lowered.contains("alter") ||
                    lowered.contains("create") ||
                    lowered.contains("truncate")) {
                return "❌ This type of query is not supported for safety reasons.";
            }

            try (Connection conn = dataSource.getConnection();
                    Statement stmt = conn.createStatement();
                    ResultSet rs = stmt.executeQuery(sql)) {

                ResultSetMetaData metaData = rs.getMetaData();
                int columnCount = metaData.getColumnCount();
                List<Map<String, Object>> rows = new ArrayList<>();

                while (rs.next()) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    for (int i = 1; i <= columnCount; i++) {
                        row.put(metaData.getColumnLabel(i), rs.getObject(i));
                    }
                    rows.add(row);
                }

                // single scalar
                if (rows.size() == 1 && rows.get(0).size() == 1) {
                    Object value = rows.get(0).values().iterator().next();
                    return value != null ? value.toString() : "null";
                }

                // full JSON array
                return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(rows);
            }

        } catch (Exception e) {
            return "❌ Error executing SQL: " + e.getMessage();
        }
    }
}