import { saveChatMessage } from '../../firebase/messages';
import { useState, useRef, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, orderBy, getDocs } from 'firebase/firestore';
import app from '../../firebase/firebase';
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
  faArrowLeft,
  faSun
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { openRouterService } from '../../utils/openRouterService';
import { useTheme } from '../../context/ThemeContext';
import '../../css/Chatbot.css';

const Chatbot = () => {
  useEffect(() => {
    document.body.classList.add('chatbot-mode');
    return () => {
      document.body.classList.remove('chatbot-mode');
    };
  }, []);
  const navigate = useNavigate();
  const location = useLocation();
  const plant = location.state?.plant || null;
  const { theme } = useTheme();
  const [messages, setMessages] = useState([]);
  // Prefill input if coming from Favorites with a plant
  const [inputMessage, setInputMessage] = useState('');
  const textareaRef = useRef(null);
  // Load chat messages from Firestore on mount
  useEffect(() => {
    const fetchMessages = async () => {
      const auth = getAuth(app);
      const db = getFirestore(app);
      const user = auth.currentUser;
      if (!user) {
        setMessages([]);
        // Prefill input and focus if coming from Favorites
        if (plant && textareaRef.current) {
          setInputMessage(`I want to ask about ${plant.name}`);
          setTimeout(() => textareaRef.current && textareaRef.current.focus(), 100);
        }
        return;
      }
      try {
        const messagesRef = collection(db, 'users', user.uid, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));
        const querySnapshot = await getDocs(q);
        const loadedMessages = [];
        querySnapshot.forEach(doc => {
          const data = doc.data();
          loadedMessages.push({
            id: doc.id,
            type: data.type,
            content: data.content,
            timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date()
          });
        });
        setMessages(loadedMessages);
        // Prefill input and focus if coming from Favorites and no history
        if (plant && filteredMessages.length === 0 && textareaRef.current) {
          setInputMessage(`I want to ask about ${plant.name}`);
          setTimeout(() => textareaRef.current && textareaRef.current.focus(), 100);
        }
      } catch (err) {
        console.error('Failed to load chat messages:', err);
        setMessages([
          {
            id: 1,
            type: 'bot',
            content: introMsg,
            timestamp: new Date()
          }
        ]);
      }
    };
    fetchMessages();
    // Optionally, listen for auth state changes and reload
    // eslint-disable-next-line
  }, [plant]);
  // (moved above for prefill logic)
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  // (already declared above)

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
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [inputMessage]);

  // Ensure sendMessage is defined before handleKeyPress
  const sendMessage = async () => {
    // Save user message to Firestore
    try {
      await saveChatMessage({ type: 'user', content: inputMessage });
    } catch (err) {
      console.error('Failed to save user message:', err);
    }
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
      const response = await fetchOpenRouterResponse(inputMessage);
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: response,
        timestamp: new Date()
      };
      // Save AI message to Firestore
      try {
        await saveChatMessage({ type: 'bot', content: response });
      } catch (err) {
        console.error('Failed to save bot message:', err);
      }
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
        .slice(-10)
        .map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

      // If plant context is present, prepend plant info to the prompt
      let prompt = message;
      if (plant) {
        prompt = `Here is the plant info:\nName: ${plant.name}\nScientific Name: ${plant.scientificName}\nDescription: ${plant.description}\nCare Guide: Water: ${plant.careGuide?.water}, Sunlight: ${plant.careGuide?.sunlight}, Soil: ${plant.careGuide?.soil}, Temperature: ${plant.careGuide?.temperature}\nFun Facts: ${(plant.funFacts || []).join(', ')}\n\nUser question: ${message}`;
      }

      const response = await openRouterService.sendMessage(prompt, conversationHistory, 'x-ai/grok-4-fast:free');
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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Add missing quickAccessCards and quickPrompts arrays for rendering
  const quickAccessCards = [
    {
      title: "Watering Tips",
      description: "How often should I water my plant?",
      prompt: "How often should I water my plant?",
      icon: faLeaf,
      color: "#4CAF50"
    },
    {
      title: "Light Requirements",
      description: "Does my plant need direct sunlight?",
      prompt: "Does my plant need direct sunlight?",
      icon: faSun,
      color: "#FFD700"
    },
    {
      title: "Common Problems",
      description: "Why are my plant's leaves turning yellow?",
      prompt: "Why are my plant's leaves turning yellow?",
      icon: faBug,
      color: "#FF5722"
    }
  ];

  const quickPrompts = [
    "How do I repot my plant?",
    "What fertilizer should I use?",
    "How do I treat pests?",
    "Can I propagate this plant?",
    "Is this plant toxic to pets?"
  ];

  return (
    <div className="chatbot-app" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Fixed Header with Back Icon and Title */}
      <div className="chatbot-header">
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="Back">
          <FontAwesomeIcon icon={faArrowLeft} size="lg" />
        </button>
        <h1>
          
          Plant Expert
        </h1>
        <div className="header-spacer" />
      </div>

      {/* Plant Heading if coming from Favorites */}
      {plant && (
        <div style={{
          textAlign: 'center',
          marginTop: 24,
          marginBottom: 8,
          fontWeight: 600,
          fontSize: 22,
          color: 'var(--primary-color)'
        }}>
          Ask about: <span style={{ color: 'var(--text-color)' }}>{plant.name}</span>
        </div>
      )}

      {/* Chat Messages */}
      <div className="chatbot-container">
        {messages.length === 0 && !isTyping && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '60%',
            minHeight: 200,
            opacity: 0.85
          }}>
            <span className="ai-avatar">
              <FontAwesomeIcon icon={faRobot} />
            </span>
            <div style={{
              marginTop: 18,
              fontSize: 22,
              fontWeight: 600,
              color: 'var(--primary-color)',
              textAlign: 'center'
            }}>
              Ask your plant care questions!
            </div>
            <div style={{
              marginTop: 8,
              fontSize: 15,
              color: 'var(--text-color)',
              textAlign: 'center',
              opacity: 0.7
            }}>
              Get instant advice, tips, and fun facts from your AI Plant Expert.
            </div>
          </div>
        )}
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
        </div>
      </div>

      {/* Floating Message Input at Bottom */}
      <div className="chat-input-container">
        <form className="chat-input" onSubmit={e => { e.preventDefault(); sendMessage(); }}>
          <textarea
            ref={textareaRef}
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask me anything about plants..."
            rows={1}
            maxLength={500}
            disabled={isLoading}
            autoFocus
          />
          <button
            type="submit"
            className="send-btn"
            disabled={!inputMessage.trim() || isLoading}
            aria-label="Send"
          >
            {isLoading ? (
              <FontAwesomeIcon icon={faSpinner} spin />
            ) : (
              <FontAwesomeIcon icon={faPaperPlane} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Chatbot;

