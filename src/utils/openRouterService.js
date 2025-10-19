// OpenRouter API Service for AI Chat
class OpenRouterService {
  constructor() {
    this.apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    this.baseURL = 'https://openrouter.ai/api/v1';
  this.model = 'meta-llama/llama-4-maverick:free'; // Free model, updated to fix 404 error
  }

  async sendMessage(message, conversationHistory = []) {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not configured. Please set VITE_OPENROUTER_API_KEY in your environment variables.');
    }

    try {
      // Prepare messages for the API
      const messages = [
        {
          role: 'system',
          content: `You are a helpful plant care expert and botanist. You have extensive knowledge about:
          - Plant identification and care
          - Common plant diseases and treatments
          - Soil types and fertilization
          - Watering schedules and techniques
          - Light requirements for different plants
          - Indoor and outdoor gardening tips
          - Plant propagation methods
          - Seasonal plant care
          - Fun facts about the plant or any historical background
          
          Always provide helpful, accurate, and practical advice. If you're unsure about something, say so and suggest consulting a local plant expert or nursery. Keep responses conversational but informative.`
        },
        ...conversationHistory,
        {
          role: 'user',
          content: message
        }
      ];

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'LeafLens AI'
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          max_tokens: 500,
          temperature: 0.7,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenRouter API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from OpenRouter API');
      }

      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('OpenRouter API Error:', error);
      throw error;
    }
  }

  // Get available models (optional)
  async getModels() {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    try {
      const response = await fetch(`${this.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  }

  // Set a different model
  setModel(modelId) {
    this.model = modelId;
  }

  // Check if API key is configured
  isConfigured() {
    return !!this.apiKey;
  }
}

// Export singleton instance
export const openRouterService = new OpenRouterService();

