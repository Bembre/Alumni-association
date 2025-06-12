import React, { useState, useRef, useEffect } from 'react';
import { FaComments, FaPaperPlane, FaTimes } from 'react-icons/fa';
import './ChatBot.css';

const FAQS = [
  {
    q: 'How do I update my profile?',
    a: 'Go to your dashboard and click the Edit Profile button. Fill in the required fields and save.'
  },
  {
    q: 'How do I register for events?',
    a: 'Navigate to the Events section, select an event, and click Register.'
  },
  {
    q: 'How do I donate?',
    a: 'Go to the Donation section from the header and follow the instructions to make a donation.'
  },
  {
    q: 'How do I join mentorship?',
    a: 'Students can join mentorship from the Mentorship section. Alumni can select students to mentor from their dashboard.'
  },
  {
    q: 'How do I contact support?',
    a: 'You can use this chat or email the admin at admin@alumni.com.'
  },
];

function getBotResponse(message) {
  const lower = message.toLowerCase();
  for (const faq of FAQS) {
    if (lower.includes(faq.q.toLowerCase().split(' ')[2])) {
      return faq.a;
    }
  }
  if (lower.includes('hello') || lower.includes('hi')) return 'Hello! How can I help you today?';
  if (lower.includes('thanks') || lower.includes('thank you')) return "You're welcome!";
  return 'Sorry, I did not understand that. Try asking about profile, events, donation, or mentorship.';
}

const ChatBot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi! I am your Alumni Assistant. How can I help you?' }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg = { from: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTimeout(() => {
      const botReply = getBotResponse(userMsg.text);
      setMessages(prev => [...prev, { from: 'bot', text: botReply }]);
    }, 600);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <div className="chatbot-widget">
      {open ? (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <span>Alumni ChatBot</span>
            <button className="chatbot-close" onClick={() => setOpen(false)}><FaTimes /></button>
          </div>
          <div className="chatbot-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chatbot-msg chatbot-msg-${msg.from}`}>{msg.text}</div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="chatbot-input-row">
            <input
              type="text"
              className="chatbot-input"
              placeholder="Type your message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button className="chatbot-send" onClick={sendMessage}><FaPaperPlane /></button>
          </div>
        </div>
      ) : (
        <button className="chatbot-fab" onClick={() => setOpen(true)}>
          <FaComments size={24} />
        </button>
      )}
    </div>
  );
};

export default ChatBot; 