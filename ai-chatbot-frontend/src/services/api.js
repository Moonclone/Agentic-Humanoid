// src/services/api.js

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

export const chatAPI = {
  /**
   * Send a query to the backend
   * @param {string} question - The user's question
   * @param {number} userId - The user's ID (default: 1)
   * @returns {Promise} - Backend response
   */
  async askQuestion(question, userId = 1) {
    try {
      const url = `${API_BASE_URL}/api/queries/ask?userId=${userId}&question=${encodeURIComponent(
        question
      )}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Add authentication headers if needed
          // 'Authorization': `Bearer ${getAuthToken()}`,
        },
        // Add body if your backend expects it
        // body: JSON.stringify({ userId, question }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Chat API Error:", error);
      throw new Error(`Failed to send message: ${error.message}`);
    }
  },

  /**
   * Upload a file (for future use)
   * @param {File} file - The file to upload
   * @param {number} userId - The user's ID
   * @returns {Promise} - Upload response
   */
  async uploadFile(file, userId = 1) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", userId);

      const response = await fetch(`${API_BASE_URL}/api/files/upload`, {
        method: "POST",
        body: formData,
        // Don't set Content-Type header for FormData
      });

      if (!response.ok) {
        throw new Error(`Upload failed! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("File Upload Error:", error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  },

  /**
   * Get chat history (for future use)
   * @param {number} userId - The user's ID
   * @returns {Promise} - Chat history
   */
  async getChatHistory(userId = 1) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/queries/history?userId=${userId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Chat History Error:", error);
      throw new Error(`Failed to fetch chat history: ${error.message}`);
    }
  },
};

// Utility function to get auth token (if you implement authentication later)
// const getAuthToken = () => {
//   return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
// };

export default chatAPI;
