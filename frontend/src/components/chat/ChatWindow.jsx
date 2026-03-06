import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import { useSocket } from '../../context/socket-context';

const ChatWindow = () => {
  const { conversationId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typing, setTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const socket = useSocket();
  const currentUserId = localStorage.getItem('userId');

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    let isMounted = true;

    api
      .get(`/messages/conversations/${conversationId}/messages`)
      .then((res) => {
        if (!isMounted) return;
        setMessages(res.data.data);
        scrollToBottom();
      })
      .catch((error) => {
        console.error('Failed to load messages', error);
      });

    return () => {
      isMounted = false;
    };
  }, [conversationId, scrollToBottom]);

  useEffect(() => {
    if (!socket) return;

    socket.emit('joinConversation', conversationId);

    socket.on('newMessage', (message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
      // Mark as read automatically
      socket.emit('markAsRead', { conversationId });
    });

    socket.on('messagesRead', ({ userId }) => {
      setMessages(prev =>
        prev.map(msg =>
          !msg.readBy.includes(userId)
            ? { ...msg, readBy: [...msg.readBy, userId] }
            : msg
        )
      );
    });

    socket.on('userTyping', ({ userId, isTyping }) => {
      if (userId !== currentUserId) {
        setOtherTyping(isTyping);
      }
    });

    return () => {
      socket.off('newMessage');
      socket.off('messagesRead');
      socket.off('userTyping');
      socket.emit('leaveConversation', conversationId);
    };
  }, [socket, conversationId, currentUserId, scrollToBottom]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    socket.emit('sendMessage', {
      conversationId,
      content: newMessage
    });
    setNewMessage('');
    setTyping(false);
    socket.emit('typing', { conversationId, isTyping: false });
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!typing && e.target.value.length > 0) {
      setTyping(true);
      socket.emit('typing', { conversationId, isTyping: true });
    } else if (typing && e.target.value.length === 0) {
      setTyping(false);
      socket.emit('typing', { conversationId, isTyping: false });
    }
  };

  return (
    <div className="d-flex flex-column" style={{ height: '70vh' }}>
      <div className="flex-grow-1 overflow-auto p-3">
        {messages.map(msg => (
          <div
            key={msg._id}
            className={`d-flex ${msg.senderId._id === currentUserId ? 'justify-content-end' : 'justify-content-start'} mb-3`}
          >
            <div
              className={`p-2 rounded ${msg.senderId._id === currentUserId ? 'bg-primary text-white' : 'bg-light'}`}
              style={{ maxWidth: '70%' }}
            >
              <p className="mb-1">{msg.content}</p>
              <small className="text-muted">
                {new Date(msg.createdAt).toLocaleTimeString()}
                {msg.readBy.length > 1 && msg.senderId._id === currentUserId && ' ✓✓'}
              </small>
            </div>
          </div>
        ))}
        {otherTyping && <p className="text-muted">Someone is typing...</p>}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="border-top p-3">
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="Type a message..."
            value={newMessage}
            onChange={handleTyping}
          />
          <button className="btn btn-primary" type="submit">Send</button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;