import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Upload,
  BarChart3,
  Sparkles,
  MessageSquare,
  Loader2,
} from "lucide-react";

const AIChatbot = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      content:
        "Hello! I'm your AI assistant. I can help you with database-related questions about users, questions, and reports. How can I help you today?",
      timestamp: new Date(),
      user: null,
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const formatTime = (timestamp) => {
    try {
      let date;

      if (!timestamp) {
        return new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });
      }

      if (typeof timestamp === "number") {
        date =
          timestamp > 1000000000000
            ? new Date(timestamp)
            : new Date(timestamp * 1000);
      } else {
        date = new Date(timestamp);
      }

      if (isNaN(date.getTime())) {
        console.warn("Invalid timestamp received:", timestamp);
        return new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });
      }

      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting time:", error, "Timestamp:", timestamp);
      return new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  // Simplified and more explicit question validation logic
  const validateAndRouteQuestion = (question) => {
    console.log(`🔍 Validating question: "${question}"`);

    const lowerQuestion = question.toLowerCase().trim();

    // STEP 1: Check for explicit database queries (HIGHEST PRIORITY)
    const explicitDatabaseQueries = [
      "how many users are there",
      "how many users",
      "count users",
      "total users",
      "list users",
      "show users",
      "show me users",
      "all users",
      "how many questions",
      "count questions",
      "how many reports",
      "count reports",
    ];

    const isExplicitDatabaseQuery = explicitDatabaseQueries.some((query) => {
      const matches = lowerQuestion.includes(query);
      if (matches) {
        console.log(`✅ EXPLICIT DATABASE QUERY DETECTED: "${query}"`);
      }
      return matches;
    });

    if (isExplicitDatabaseQuery) {
      console.log(`🎯 DECISION: SEND TO BACKEND - Explicit database query`);
      return {
        isDatabaseQuery: true,
        isGenericQuery: false,
        shouldSendToBackend: true,
      };
    }

    // STEP 2: Check for database patterns
    const databasePatterns = [
      /^how many .* (user|users|question|questions|report|reports)/i,
      /^show me .* (user|users|question|questions|report|reports)/i,
      /^list .* (user|users|question|questions|report|reports)/i,
      /^what .* (name|username|email) .* (user|users)/i,
      /^what was .* (first|last) .* (question|report)/i,
      /^find .* (user|users|question|questions|report|reports)/i,
      /^get .* (user|users|question|questions|report|reports)/i,
      /^count .* (user|users|question|questions|report|reports)/i,
      /^total .* (user|users|question|questions|report|reports)/i,
      /who is user \d+/i,
      /what is the .* of user \d+/i,
    ];

    const matchedDatabasePattern = databasePatterns.find((pattern) =>
      pattern.test(lowerQuestion)
    );
    if (matchedDatabasePattern) {
      console.log(`✅ MATCHED DATABASE PATTERN: ${matchedDatabasePattern}`);
      console.log(`🎯 DECISION: SEND TO BACKEND - Database pattern match`);
      return {
        isDatabaseQuery: true,
        isGenericQuery: false,
        shouldSendToBackend: true,
      };
    }

    // STEP 3: Check for capability/generic questions (LOWER PRIORITY)
    const capabilityPatterns = [
      /are you (able|capable) (to|of)/i,
      /can you (add|create|delete|update|modify)/i,
      /do you (know how|understand how)/i,
      /what can you do/i,
      /what are your capabilities/i,
      /help me with (?!.*user|.*question|.*report)/i,

      // Weather and general knowledge questions
      /what.*weather/i,
      /how.*weather/i,
      /weather.*today/i,
      /temperature.*today/i,

      // General knowledge questions
      /what is (the|a)/i,
      /who is/i,
      /where is/i,
      /when is/i,
      /why is/i,
      /how does.*work/i,
      /tell me about/i,
      /explain/i,
      /define/i,

      // AI/Technology questions
      /what (is|are) (ai|artificial intelligence)/i,
      /how (do|does) (you|ai|chatbot) work/i,
      /what do you know about/i,

      // Math, science, general help
      /help me (calculate|solve|understand)/i,
      /what.*meaning/i,
      /how to/i,
      /can you help.*with/i,

      // Time and date questions
      /what.*time/i,
      /what.*date/i,
      /what.*day/i,

      // Any question that doesn't contain database-related words
      /^(?!.*\b(user|users|question|questions|report|reports|database|count|list|show|find|total)\b).*\?$/i,
    ];

    const matchedCapabilityPattern = capabilityPatterns.find((pattern) =>
      pattern.test(lowerQuestion)
    );
    if (matchedCapabilityPattern) {
      console.log(
        `🚫 MATCHED GENERIC/CAPABILITY PATTERN: ${matchedCapabilityPattern}`
      );
      console.log(`🎯 DECISION: SHOW HELP - Generic/capability question`);
      return {
        isDatabaseQuery: false,
        isGenericQuery: true,
        shouldSendToBackend: false,
      };
    }

    // STEP 4: Final check - if it contains database keywords, send to backend
    const databaseKeywords = [
      "user",
      "users",
      "question",
      "questions",
      "report",
      "reports",
      "database",
      "count",
      "total",
    ];
    const containsDatabaseKeywords = databaseKeywords.some((keyword) =>
      lowerQuestion.includes(keyword)
    );

    if (containsDatabaseKeywords) {
      console.log(
        `🎯 DECISION: SEND TO BACKEND - Contains database keywords: ${databaseKeywords.filter(
          (k) => lowerQuestion.includes(k)
        )}`
      );
      return {
        isDatabaseQuery: true,
        isGenericQuery: false,
        shouldSendToBackend: true,
      };
    }

    // STEP 5: Default for non-database questions - show help
    console.log(
      `🚫 DECISION: SHOW HELP - No database keywords found, treating as general question`
    );
    return {
      isDatabaseQuery: false,
      isGenericQuery: true,
      shouldSendToBackend: false,
    };
  };

  // Generate helpful response for non-database questions
  const generateHelpfulResponse = (question) => {
    const lowerQuestion = question.toLowerCase();

    // Different responses based on question type
    let responseText = "";

    if (lowerQuestion.includes("weather")) {
      responseText = `I can't provide weather information as I'm a specialized database assistant for querying user data, questions, and reports.`;
    } else if (
      lowerQuestion.includes("time") ||
      lowerQuestion.includes("date")
    ) {
      responseText = `I can't provide current time or date information as I'm focused on database queries only.`;
    } else if (
      lowerQuestion.includes("capable") ||
      lowerQuestion.includes("can you")
    ) {
      responseText = `I'm a specialized database assistant that can only answer questions about your database records (users, questions, and reports).`;
    } else {
      responseText = `I'm a specialized database assistant that can only help with queries about your database.`;
    }

    const examples = [
      "How many users are there?",
      "What is the name of user 3?",
      "Show me all reports for User 2.",
      "List all users in the database.",
      "Count total questions asked.",
      "Find questions by User 3.",
      "What was the first question asked by User 1?",
    ];

    return {
      id: Date.now(),
      type: "bot",
      content: `${responseText}\n\nYour question "${question}" is outside my scope.\n\nHere are examples of questions I can help with:\n${examples
        .map((ex) => `• ${ex}`)
        .join(
          "\n"
        )}\n\nPlease ask me something about the data in your database! 📊`,
      timestamp: new Date(),
      isHelpMessage: true,
      originalQuestion: question,
    };
  };

  // API call to your backend with comprehensive debugging
  const sendToBackend = async (queryText) => {
    const requestId = Date.now();
    console.group(`🚀 API Request #${requestId}`);

    setIsTyping(true);

    try {
      const API_BASE_URL =
        process.env.REACT_APP_API_URL || "http://localhost:8080";
      const userId = 1;
      const url = `${API_BASE_URL}/api/queries/ask?userId=${userId}&question=${encodeURIComponent(
        queryText
      )}`;

      console.log("📋 Request Details:", {
        requestId,
        timestamp: new Date().toISOString(),
        url: url,
        query: queryText,
        encodedQuery: encodeURIComponent(queryText),
        userId: userId,
        method: "POST",
      });

      const startTime = performance.now();

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      console.log("📡 Response Info:", {
        requestId,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        responseTime: `${responseTime}ms`,
        headers: Object.fromEntries(response.headers.entries()),
        url: response.url,
      });

      if (!response.ok) {
        let errorDetails;
        try {
          errorDetails = await response.text();
        } catch (textError) {
          errorDetails = "Could not read error response";
          console.error("📄 Failed to read error response:", textError);
        }

        console.error("❌ HTTP Error Details:", {
          requestId,
          status: response.status,
          statusText: response.statusText,
          errorBody: errorDetails,
          url: response.url,
        });

        throw new Error(
          `HTTP ${response.status}: ${response.statusText} - ${errorDetails}`
        );
      }

      let data;
      try {
        const responseText = await response.text();
        console.log("📄 Raw Response Text:", {
          requestId,
          length: responseText.length,
          preview:
            responseText.substring(0, 200) +
            (responseText.length > 200 ? "..." : ""),
          fullText: responseText,
        });

        data = JSON.parse(responseText);
        console.log("✅ Parsed JSON Data:", {
          requestId,
          data: data,
          dataType: typeof data,
          isArray: Array.isArray(data),
          keys: typeof data === "object" && data ? Object.keys(data) : "N/A",
        });
      } catch (parseError) {
        console.error("💥 JSON Parse Error:", {
          requestId,
          parseError: parseError.message,
        });
        throw new Error(`Failed to parse JSON response: ${parseError.message}`);
      }

      setIsTyping(false);
      console.log("🎉 Request completed successfully");
      console.groupEnd();
      return data;
    } catch (error) {
      setIsTyping(false);

      console.error("💥 Complete Error Details:", {
        requestId,
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
        timestamp: new Date().toISOString(),
        query: queryText,
      });

      if (error.name === "TypeError") {
        if (error.message.includes("fetch")) {
          console.error("🌐 NETWORK ERROR - Possible causes:");
          console.error("   • Backend server is not running");
          console.error("   • CORS is not properly configured");
          console.error("   • Wrong URL or port number");
          console.error("   • Firewall blocking the request");
        } else if (error.message.includes("JSON")) {
          console.error("📝 JSON PARSING ERROR - Possible causes:");
          console.error("   • Backend returned non-JSON response");
          console.error("   • Response is malformed JSON");
          console.error("   • Backend returned HTML error page");
        }
      } else if (error.message.includes("HTTP")) {
        console.error("🚫 HTTP ERROR - Backend responded with error status");
        console.error("   • Check backend logs for detailed error");
        console.error("   • Verify API endpoint exists");
        console.error("   • Check request parameters");
      }

      console.groupEnd();
      throw error;
    }
  };

  // Enhanced smart response formatter with detailed logging
  const formatAIResponse = (response, requestId) => {
    console.log(`🎨 Formatting Response #${requestId}:`, {
      originalResponse: response,
      responseType: typeof response,
      isArray: Array.isArray(response),
      isNull: response === null,
      isUndefined: response === undefined,
    });

    try {
      if (typeof response === "string") {
        console.log(`📝 String response: "${response}"`);
        return response;
      }

      if (response === null || response === undefined) {
        console.warn("⚠️ Response is null or undefined");
        return "No response received from the server.";
      }

      if (Array.isArray(response)) {
        console.log(
          `📋 Array response with ${response.length} items:`,
          response
        );

        if (response.length === 0) {
          return "No results found.";
        }

        if (typeof response[0] === "object" && response[0] !== null) {
          const formatted = response
            .map((item, index) => {
              console.log(`  Item ${index}:`, item);
              const entries = Object.entries(item);
              if (entries.length === 1) {
                const value = entries[0][1];
                console.log(`  Formatted as single value: "${value}"`);
                return value;
              } else {
                const formatted = entries
                  .map(([key, value]) => `${key}: ${value}`)
                  .join(", ");
                console.log(`  Formatted as key-value pairs: "${formatted}"`);
                return formatted;
              }
            })
            .join("\n");

          console.log(`✅ Final formatted array result: "${formatted}"`);
          return formatted;
        }

        const joined = response.join(", ");
        console.log(`✅ Joined primitive array: "${joined}"`);
        return joined;
      }

      if (typeof response === "object" && response !== null) {
        console.log(`🗂️ Object response:`, response);
        const entries = Object.entries(response);

        if (entries.length === 1) {
          const [key, value] = entries[0];
          if (
            key.toLowerCase().includes("name") ||
            key.toLowerCase().includes("username")
          ) {
            const formatted = `The ${key} is: ${value}`;
            console.log(`✅ Formatted single name field: "${formatted}"`);
            return formatted;
          }
          console.log(`✅ Formatted single value: "${value}"`);
          return String(value);
        } else {
          const formatted = entries
            .map(([key, value]) => `${key}: ${value}`)
            .join("\n");
          console.log(`✅ Formatted multiple fields: "${formatted}"`);
          return formatted;
        }
      }

      const stringified = String(response);
      console.log(`✅ Formatted primitive value: "${stringified}"`);
      return stringified;
    } catch (error) {
      console.error("💥 Error formatting AI response:", {
        requestId,
        error: error.message,
        originalResponse: response,
        errorStack: error.stack,
      });
      return "Unable to format the response properly.";
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const messageId = Date.now();
    console.log(`📨 Starting new message #${messageId}: "${inputText}"`);

    const userMessage = {
      id: messageId,
      type: "user",
      content: inputText,
      timestamp: new Date(),
      user: { username: "santanuuu" },
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputText;
    setInputText("");

    // Validate question before sending to backend
    const questionAnalysis = validateAndRouteQuestion(currentInput);

    if (!questionAnalysis.shouldSendToBackend) {
      console.log(`🚫 Question not suitable for backend:`, questionAnalysis);
      const helpMessage = generateHelpfulResponse(currentInput);
      setMessages((prev) => [...prev, helpMessage]);
      return;
    }

    try {
      console.log(`✅ Question approved for backend processing`);
      console.log(`🔄 Processing message #${messageId}`);
      const response = await sendToBackend(currentInput);

      console.group(`🤖 Creating Bot Response #${messageId}`);
      console.log("📥 Raw backend response:", response);

      let aiResponseContent;
      let responseSource = "unknown";

      if (
        response &&
        typeof response === "object" &&
        "responseText" in response
      ) {
        console.log("📦 Detected wrapped response format");
        aiResponseContent = formatAIResponse(response.responseText, messageId);
        responseSource = "wrapped";
      } else {
        console.log("📋 Detected direct response format");
        aiResponseContent = formatAIResponse(response, messageId);
        responseSource = "direct";
      }

      const botMessage = {
        id: (response && response.id) || messageId + 1,
        type: "bot",
        content: aiResponseContent,
        timestamp: (response && response.createdAt) || new Date(),
        user: (response && response.user) || null,
        queryText: currentInput,
        rawResponse: response,
        responseSource: responseSource,
      };

      console.log("🎯 Final bot message:", {
        messageId,
        content: aiResponseContent,
        contentLength: aiResponseContent?.length,
        responseSource,
        originalResponseType: typeof response,
        hasError:
          !aiResponseContent || aiResponseContent.includes("Unable to format"),
      });

      console.groupEnd();
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.group(`💥 Error Handling Message #${messageId}`);
      console.error("Full error details:", {
        messageId,
        errorType: error.constructor.name,
        errorMessage: error.message,
        errorStack: error.stack,
        userInput: currentInput,
        timestamp: new Date().toISOString(),
      });

      let userFriendlyMessage =
        "Sorry, I encountered an error processing your request.";

      if (error.name === "TypeError" && error.message.includes("fetch")) {
        userFriendlyMessage =
          "Connection error: Unable to reach the server. Please check if the backend is running.";
        console.error("🌐 Network/Connection Error - Backend might be down");
      } else if (error.message.includes("JSON")) {
        userFriendlyMessage =
          "Server response error: Received invalid data format.";
        console.error("📄 Data Format Error - Backend returned non-JSON");
      } else if (error.message.includes("HTTP")) {
        userFriendlyMessage = `Server error: ${error.message}`;
        console.error("🚫 HTTP Error - Backend returned error status");
      } else if (error.message.includes("CORS")) {
        userFriendlyMessage =
          "Configuration error: Please check CORS settings.";
        console.error("🔒 CORS Error - Cross-origin request blocked");
      }

      const errorMessage = {
        id: messageId + 1,
        type: "bot",
        content: userFriendlyMessage + " Please try again.",
        timestamp: new Date(),
        isError: true,
        errorDetails: {
          originalError: error.message,
          errorType: error.name,
          userInput: currentInput,
        },
      };

      console.log("📝 Created error message:", errorMessage);
      console.groupEnd();
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const onFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileMessage = {
        id: Date.now(),
        type: "user",
        content: `📎 Uploaded file: ${file.name}`,
        timestamp: new Date(),
        isFile: true,
        fileName: file.name,
      };
      setMessages((prev) => [...prev, fileMessage]);
      console.log("File selected:", file);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-indigo-100 px-6 py-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              Database AI Assistant{" "}
              <Sparkles className="w-5 h-5 text-indigo-500" />
            </h1>
            <p className="text-sm text-gray-500">
              Ask me about users, questions, and reports
            </p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${
              message.type === "user" ? "flex-row-reverse space-x-reverse" : ""
            }`}
          >
            {/* Avatar */}
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                message.type === "user"
                  ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                  : message.isError
                  ? "bg-red-500"
                  : message.isHelpMessage
                  ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                  : "bg-gradient-to-r from-indigo-500 to-purple-600"
              } shadow-lg`}
            >
              {message.type === "user" ? (
                <User className="w-5 h-5 text-white" />
              ) : (
                <Bot className="w-5 h-5 text-white" />
              )}
            </div>

            {/* Message Bubble */}
            <div
              className={`max-w-xs lg:max-w-md xl:max-w-lg ${
                message.type === "user" ? "text-right" : "text-left"
              }`}
            >
              <div
                className={`relative px-4 py-3 rounded-2xl shadow-md ${
                  message.type === "user"
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                    : message.isError
                    ? "bg-red-50 border border-red-200 text-red-800"
                    : message.isHelpMessage
                    ? "bg-yellow-50 border border-yellow-200 text-yellow-800"
                    : "bg-white border border-gray-200 text-gray-800"
                }`}
              >
                {message.isFile && (
                  <div className="flex items-center space-x-2 mb-2">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {message.fileName}
                    </span>
                  </div>
                )}
                <p className="whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </p>

                {/* Message tail */}
                <div
                  className={`absolute top-4 ${
                    message.type === "user"
                      ? "-right-2 border-l-8 border-l-transparent border-t-8 border-t-blue-500"
                      : message.isError
                      ? "-left-2 border-r-8 border-r-transparent border-t-8 border-t-red-50"
                      : message.isHelpMessage
                      ? "-left-2 border-r-8 border-r-transparent border-t-8 border-t-yellow-50"
                      : "-left-2 border-r-8 border-r-transparent border-t-8 border-t-white"
                  }`}
                ></div>
              </div>

              {/* Timestamp */}
              <div
                className={`text-xs text-gray-400 mt-1 ${
                  message.type === "user" ? "text-right" : "text-left"
                }`}
              >
                {formatTime(message.timestamp)}
                {message.user && message.type === "user" && (
                  <span className="ml-1">• {message.user.username}</span>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-md">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-indigo-100 bg-white/80 backdrop-blur-lg px-4 py-4">
        <div className="max-w-4xl mx-auto">
          {/* Feature Buttons */}
          <div className="flex space-x-2 mb-3">
            <button
              onClick={handleFileUpload}
              className="flex items-center space-x-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span className="text-sm">Upload</span>
            </button>
            <button className="flex items-center space-x-2 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg transition-colors">
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm">Reports</span>
            </button>
          </div>

          {/* Input Field */}
          <div className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about users, questions, or reports..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none max-h-32 placeholder-gray-400"
                rows={1}
                style={{ minHeight: "48px" }}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isTyping}
              className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 disabled:cursor-not-allowed"
            >
              {isTyping ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={onFileSelect}
        accept=".pdf,.doc,.docx,.txt,.csv,.xlsx"
      />
    </div>
  );
};

export default AIChatbot;
