import { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPaperPlane, 
  faMicrophone, 
  faImage, 
  faHeart,
  faFolder,
  faComments,
  faSpinner,
  faRobot,
  faUser,
  faLeaf,
  faBug,
  faBook,
  faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/header/Header';
import { openRouterService } from '../../utils/openRouterService';
import { useTheme } from '../../context/ThemeContext';
import '../../css/Chatbot.css';

const Chatbot = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Hello! I'm your plant care expert. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    document.body.classList.add('chatbot-mode');
    return () => {
      document.body.classList.remove('chatbot-mode');
    };
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputMessage]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      // Simulate API call to OpenRouter
      const response = await fetchOpenRouterResponse(inputMessage);
      
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: response,
        timestamp: new Date()
      };

      setTimeout(() => {
        setMessages(prev => [...prev, botMessage]);
        setIsLoading(false);
        setIsTyping(false);
      }, 1500);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again later.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const fetchOpenRouterResponse = async (message) => {
    try {
      // Check if OpenRouter is configured
      if (!openRouterService.isConfigured()) {
        return "I'm your plant care expert! However, the AI service isn't configured yet. Please set up your OpenRouter API key to get AI-powered responses. For now, I can provide general plant care advice: most plants need bright, indirect light, well-draining soil, and regular but not excessive watering.";
      }

      // Prepare conversation history for context
      const conversationHistory = messages
        .filter(msg => msg.type === 'user' || msg.type === 'bot')
        .slice(-10) // Keep last 10 messages for context
        .map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

      const response = await openRouterService.sendMessage(message, conversationHistory);
      return response;
    } catch (error) {
      console.error('Error fetching AI response:', error);
      
      // Fallback responses based on common plant questions
      const lowerMessage = message.toLowerCase();
      
      if (lowerMessage.includes('water') || lowerMessage.includes('watering')) {
        return "For watering, the general rule is to water when the top inch of soil feels dry. Most plants prefer deep, infrequent watering rather than frequent light watering. Make sure your pots have drainage holes to prevent root rot.";
      } else if (lowerMessage.includes('light') || lowerMessage.includes('sun')) {
        return "Most houseplants prefer bright, indirect light. Avoid direct sunlight which can scorch leaves. South-facing windows are great for plants that need more light, while north-facing windows work well for low-light plants.";
      } else if (lowerMessage.includes('disease') || lowerMessage.includes('sick') || lowerMessage.includes('problem')) {
        return "Common plant problems include yellowing leaves (often overwatering), brown tips (low humidity or over-fertilizing), and drooping (underwatering or root issues). Can you describe the specific symptoms you're seeing?";
      } else if (lowerMessage.includes('fertilizer') || lowerMessage.includes('feed')) {
        return "Most plants benefit from fertilizing during their growing season (spring and summer). Use a balanced fertilizer diluted to half strength. Avoid fertilizing in winter when plants are dormant.";
      } else {
        return "I'm having trouble connecting to the AI service right now, but I'm here to help with your plant questions! Feel free to ask about watering, lighting, common problems, or plant care tips.";
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.shiftKey) {
      // Allow Shift+Enter for new line (default behavior)
      return;
    } else if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickPrompts = [
    "How often should I water my plants?",
    "What's wrong with my plant's leaves?",
    "Best plants for beginners",
    "Plant disease identification"
  ];

  const quickAccessCards = [
    {
      icon: faBug,
      title: "Plant Health",
      description: "Diagnose diseases, pests, and health issues",
      color: "#e91e63",
      prompt: "My plant has yellow leaves and brown spots, what's wrong?"
    },
    {
      icon: faBook,
      title: "Care Guides",
      description: "Complete care instructions for your plants",
      color: "#2196f3",
      prompt: "How do I care for a Monstera deliciosa?"
    },
    {
      icon: faLeaf,
      title: "Plant ID",
      description: "Identify plants from photos or descriptions",
      color: "#4caf50",
      prompt: "What plant is this? It has large green leaves with holes."
    }
  ];

  return (
    <div className="chatbot-app">
      <div className="chatbot-header">
        <button 
          className="back-btn"
          onClick={() => navigate('/')}
          title="Back to Home"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <h1>Plant Expert</h1>
        <div className="header-spacer"></div>
      </div>
      
      <div className="chatbot-container">
        {/* Welcome Section */}
        {messages.length === 1 && (
          <div className="welcome-section">
            <div className="welcome-content">
              <div className="ai-avatar">
                <FontAwesomeIcon icon={faRobot} />
              </div>
              <h2>Hey there! I'm your Plant Expert</h2>
              <p>Unleash your plant care potential with AI-powered assistance.</p>
              
              <div className="quick-access">
                <h3>Quick Access</h3>
                <div className="quick-cards">
                  {quickAccessCards.map((card, index) => (
                    <button 
                      key={index} 
                      className="quick-card" 
                      style={{ borderLeftColor: card.color }}
                      onClick={() => setInputMessage(card.prompt)}
                    >
                      <FontAwesomeIcon icon={card.icon} style={{ color: card.color }} />
                      <div>
                        <h4>{card.title}</h4>
                        <p>{card.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="recent-prompts">
                <h3>Recent Prompts</h3>
                <div className="prompt-chips">
                  {quickPrompts.map((prompt, index) => (
                    <button 
                      key={index} 
                      className="prompt-chip"
                      onClick={() => setInputMessage(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <div className="chat-messages">
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.type}`}>
              <div className="message-avatar">
                {message.type === 'bot' ? (
                  <FontAwesomeIcon icon={faRobot} />
                ) : (
                  <FontAwesomeIcon icon={faUser} />
                )}
              </div>
              <div className="message-content">
                <div className="message-bubble">
                  {message.content}
                </div>
                <div className="message-time">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="message bot typing">
              <div className="message-avatar">
                <FontAwesomeIcon icon={faRobot} />
              </div>
              <div className="message-content">
                <div className="message-bubble typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
                <div className="chat-input-container">
                  <div className="chat-input">
                    <div className="input-actions-left">
                      <button className="action-btn" title="Voice Input">
                        <FontAwesomeIcon icon={faMicrophone} />
                      </button>
                      <button className="action-btn" title="Image Upload">
                        <FontAwesomeIcon icon={faImage} />
                      </button>
                    </div>
                    <textarea
                      ref={textareaRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Ask me anything about plants..."
                      disabled={isLoading}
                      rows={1}
                    />
                    <div className="input-actions-right">
                      <button 
                        className="send-btn"
                        onClick={sendMessage}
                        disabled={!inputMessage.trim() || isLoading}
                      >
                        {isLoading ? (
                          <FontAwesomeIcon icon={faSpinner} spin />
                        ) : (
                          <FontAwesomeIcon icon={faPaperPlane} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
      </div>
    </div>
  );
};

export default Chatbot;
