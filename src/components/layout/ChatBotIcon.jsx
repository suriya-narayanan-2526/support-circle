import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageCircle, FiX, FiSend, FiUser } from 'react-icons/fi';
import { Link } from 'react-router-dom';

/* ─── WARM CHARITY THEME TOKENS ─── */
const T = {
  orange: '#E8622A',
  orangeDark: '#D4541E',
  orangeGlow: 'rgba(232,98,42,0.3)',
  orangeLight: '#FFF0EA',
  bg: '#FFFDF9',
  surface: '#FFFFFF',
  surfaceMid: '#FFF5EE',
  border: 'rgba(28,25,23,0.08)',
  textPrimary: '#1C1917',
  textSecondary: '#78716C',
  textMuted: '#A8A29E',
};

export const ChatBotIcon = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, content: "Hi there! 👋 I'm your Support Circle assistant.", sender: 'bot' },
    { id: 2, content: "You can ask me things like:\n• What is the role of a donor?\n• How can I donate?\n• How do volunteers work?", sender: 'bot' }
  ]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const getBotResponse = (msg) => {
    const lower = msg.toLowerCase();
    
    if (lower.includes('role') && lower.includes('donor')) {
      return "Donors are the heart of Support Circle! ❤️ As a donor, your role is to provide essential surplus or new items (like clothes, books, and raw food). You simply pack the items, and our verified volunteers will pick them up right from your doorstep to deliver to orphanages.";
    }
    
    if (lower.includes('become') && lower.includes('volunteer')) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span>Becoming a volunteer is simple! Just follow these steps:</span>
          <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <li>Go to the <Link to="/auth/register" style={{ color: T.orange, fontWeight: 800, textDecoration: 'underline' }}>Registration Page</Link>.</li>
            <li>Select the <strong>"Volunteer"</strong> role.</li>
            <li>Fill in your details (name, email, and vehicle info if applicable).</li>
            <li>Submit your profile for a quick safety verification.</li>
            <li>Once approved, log into your dashboard and accept your first pickup mission!</li>
          </ol>
        </div>
      );
    }

    if (lower.includes('how') && lower.includes('donate') || lower.includes('donate')) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span>It is very easy to make a donation! Just follow these steps:</span>
          <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li><strong>Login</strong> to your Donor Dashboard.</li>
            <li>Add your <strong>Delivery Address</strong> on the dashboard.</li>
            <li>Click on the <strong>Donate</strong> action.</li>
            <li>Select the correct <strong>category</strong> for your items.</li>
            <li>Make sure to provide your correct <strong>phone number</strong>.</li>
            <li>After the donation is complete, our delivery partner will come and <strong>pickup</strong> your items securely!</li>
          </ol>
        </div>
      );
    }
    
    // --- PROHIBITED / INAPPROPRIATE ---
    if (lower.includes('fuck') || lower.includes('shit') || lower.includes('bitch') || lower.includes('asshole')) {
      return "Let's keep things kind and respectful! 💙 Support Circle is all about spreading positivity and helping those in need. How can I assist you with your donation today?";
    }

    // --- EMOTIONAL / ROMANTIC ---
    if (lower.includes('love you')) {
      return "Aww, thank you! ❤️ I'm just a bot, but I love helping kind-hearted people like you make a difference in the world!";
    }
    if (lower.includes('hate you')) {
      return "I'm sorry to hear that. 😔 I'm an AI still learning how to be helpful. If you have any feedback about the platform, our human team would love to hear it!";
    }
    if (lower.includes('date') && lower.includes('me') || lower.includes('marry me')) {
      return "I'm flattered! But my heart belongs exclusively to the Support Circle mission. 📦 Plus, I don't eat or drink, I just run on code! Let's focus on helping orphanages together.";
    }

    // --- IDENTITY / ABOUT BOT & PLATFORM ---
    if (lower.includes('achievement') || lower.includes('achievements')) {
      return "Support Circle's biggest achievement is building a trust-first ecosystem! 🌟 We have successfully digitized the donation process, eliminated middleman confusion by using verified volunteers, and ensured zero waste of surplus food and items by routing them directly to verified orphanages in record time.";
    }

    if (lower.includes('site') || lower.includes('website') || lower.includes('platform') || lower.includes('web app') || (lower.includes('about') && lower.includes('support circle'))) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span><strong>Support Circle</strong> is a tech-driven charity logistics platform built to make donating effortless and transparent. Here's what our site offers:</span>
          <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li><strong>Donor Dashboard</strong> — Easily list surplus items, set your address, and track pickups in real-time.</li>
            <li><strong>Volunteer Network</strong> — Verified volunteers accept missions, undergo face verification, and securely pick up donations using an OTP system.</li>
            <li><strong>Orphanage Portal</strong> — Registered orphanages receive donations directly, ensuring zero waste.</li>
            <li><strong>Live Courier Tracking</strong> — Donors can track their volunteer on a live map, just like a ride-sharing app.</li>
            <li><strong>AI Chatbot</strong> — That's me! I guide you through every step of the process. 🤖</li>
          </ol>
          <span>Want to learn more? Check out our <Link to="/about" style={{ color: T.orange, fontWeight: 800, textDecoration: 'underline' }}>About Page</Link>.</span>
        </div>
      );
    }

    if (lower.includes('about') && lower.includes('you')) {
      return "I am the Support Circle Assistant! 🤖 I am an AI designed to help you navigate this charity platform, guide you through making donations, and explain how our logistics network operates.";
    }

    if (lower.includes('about')) {
      return (
        <span>
          <strong>Support Circle</strong> is a tech-driven charity logistics platform. We bridge the gap between people with surplus goods (Donors) and Orphanages that need them. Instead of a messy drop-off process, we use an active network of verified Volunteers who pick up and deliver donations securely. Want to dive deeper? Check out our <Link to="/about" style={{ color: T.orange, fontWeight: 800, textDecoration: 'underline' }}>About Page</Link>.
        </span>
      );
    }

    // --- ROLES ---
    if (lower.includes('role') && lower.includes('donor')) {
      return "The role of a Donor is the starting point of our mission! ❤️ As a donor, your role is to identify surplus or new items (like clothes, books, and safe food), list them on our dashboard, and pack them up securely. Once you submit a request, a verified volunteer handles the rest!";
    }

    if (lower.includes('role') && lower.includes('volunteer')) {
      return "The role of a Volunteer is to act as our trusted logistics partner! 🚚 Volunteers accept pickup missions, travel to the donor's address, verify their identity using a secure OTP, and physically transport the items to the designated orphanage safely and quickly.";
    }

    if (lower.includes('volunteer') || lower.includes('how it works') || lower.includes('logistics')) {
      return "Here is how it works: Donors list items they want to give. Verified Volunteers then claim these pickup missions. The volunteer travels to the donor's address, collects the packages securely using an OTP, and hand-delivers them to an orphanage in need.";
    }

    if (lower.includes('hi') || lower.includes('hello')) {
      return "Hello! 😊 How can I help you make a difference today?";
    }

    return "I'm still learning! 🤖 I can best answer questions about the Donor role, how to donate, or how our volunteer network works. Try asking me one of those!";
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMsg = message.trim();
    
    // Add user message
    setMessages(prev => [...prev, { id: Date.now(), content: userMsg, sender: 'user' }]);
    setMessage('');

    // Simulate bot thinking and replying
    setTimeout(() => {
      const botReply = getBotResponse(userMsg);
      setMessages(prev => [...prev, { id: Date.now() + 1, content: botReply, sender: 'bot' }]);
    }, 600);
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 }}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95, transition: { duration: 0.2 } }}
            style={{
              position: 'absolute', bottom: '80px', right: 0,
              width: '340px', height: '480px',
              background: T.surface, borderRadius: '24px',
              boxShadow: '0 12px 40px rgba(28,25,23,0.12)', border: `1px solid ${T.border}`,
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              background: `linear-gradient(135deg, ${T.orange}, ${T.orangeDark})`,
              padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fff',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%', background: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.orange,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}>
                  <FiMessageCircle size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>Support Circle Bot</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981' }} />
                    <p style={{ fontSize: 11, margin: 0, opacity: 0.9, fontWeight: 600 }}>Online — Replies instantly</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 4, transition: 'opacity 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.opacity = 0.7}
                onMouseOut={(e) => e.currentTarget.style.opacity = 1}
              >
                <FiX size={22} />
              </button>
            </div>

            {/* Chat Area */}
            <div style={{ flex: 1, padding: '20px', background: T.bg, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
              {messages.map((msg) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  key={msg.id} 
                  style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}
                >
                  <div style={{ display: 'flex', gap: 8, flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-end' }}>
                    {/* Avatar */}
                    {msg.sender === 'bot' ? (
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: T.orangeLight, color: T.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FiMessageCircle size={12} />
                      </div>
                    ) : (
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: T.surfaceMid, border: `1px solid ${T.border}`, color: T.textSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FiUser size={12} />
                      </div>
                    )}
                    
                    {/* Bubble */}
                    <div style={{
                      background: msg.sender === 'user' ? T.orange : T.surface,
                      color: msg.sender === 'user' ? '#fff' : T.textPrimary,
                      border: msg.sender === 'user' ? 'none' : `1px solid ${T.border}`,
                      padding: '12px 16px',
                      borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      fontSize: 13.5,
                      lineHeight: 1.6,
                      boxShadow: msg.sender === 'user' ? `0 4px 12px ${T.orangeGlow}` : '0 2px 8px rgba(0,0,0,0.02)',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {msg.content}
                    </div>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{ padding: '16px', background: T.surface, borderTop: `1px solid ${T.border}` }}>
              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  placeholder="Ask a question..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{
                    flex: 1, background: T.bg, border: `1px solid ${T.border}`, borderRadius: '999px',
                    padding: '12px 18px', fontSize: 13.5, color: T.textPrimary, outline: 'none', transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = T.orange}
                  onBlur={(e) => e.target.style.borderColor = T.border}
                />
                <button
                  type="submit"
                  disabled={!message.trim()}
                  style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: message.trim() ? T.orange : T.orangeLight,
                    color: message.trim() ? '#fff' : T.orange,
                    border: 'none', cursor: message.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s', flexShrink: 0,
                    boxShadow: message.trim() ? `0 4px 12px ${T.orangeGlow}` : 'none'
                  }}
                >
                  <FiSend size={18} style={{ transform: 'translateX(2px)' }} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: `linear-gradient(135deg, ${T.orange}, ${T.orangeDark})`, color: '#fff', border: 'none',
          boxShadow: `0 8px 24px ${T.orangeGlow}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', outline: 'none',
        }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <FiX size={28} />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <FiMessageCircle size={28} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};
