import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import api from '../../services/api';
import { useSocket } from '../../context/socket-context';

const normalizeMessage = (message) => ({
  ...message,
  readBy: Array.isArray(message.readBy) ? message.readBy.map((id) => id?.toString()) : []
});

const getSenderId = (message) =>
  typeof message.senderId === 'object' ? message.senderId?._id?.toString() : message.senderId?.toString();

const upsertMessage = (list, incoming) => {
  const normalizedIncoming = normalizeMessage(incoming);
  const idx = list.findIndex((item) => item._id === normalizedIncoming._id);

  if (idx === -1) return [...list, normalizedIncoming];

  const next = [...list];
  next[idx] = normalizedIncoming;
  return next;
};

const ChatWindow = () => {
  const { conversationId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typing, setTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const socket = useSocket();
  const currentUserId = localStorage.getItem('userId');

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const markConversationRead = useCallback(async () => {
    try {
      await api.post(`/messages/conversations/${conversationId}/read`);
      if (socket) socket.emit('markAsRead', { conversationId });
    } catch (err) {
      // Non-fatal: conversation still works if read sync fails momentarily.
      console.error('Failed to mark conversation as read', err);
    }
  }, [conversationId, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    let isMounted = true;

    const loadMessages = async () => {
      try {
        setLoading(true);
        setError('');

        const res = await api.get(`/messages/conversations/${conversationId}/messages`);
        if (!isMounted) return;

        setMessages((res.data.data || []).map(normalizeMessage));
        await markConversationRead();
      } catch (err) {
        if (!isMounted) return;
        setError(err.response?.data?.message || 'Failed to load messages');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadMessages();

    return () => {
      isMounted = false;
    };
  }, [conversationId, markConversationRead]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = async (message) => {
      setMessages((prev) => upsertMessage(prev, message));

      if (getSenderId(message) !== currentUserId) {
        await markConversationRead();
      }
    };

    const handleMessagesRead = ({ userId }) => {
      const readUserId = userId?.toString();
      if (!readUserId) return;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.readBy.includes(readUserId)
            ? msg
            : { ...msg, readBy: [...msg.readBy, readUserId] }
        )
      );
    };

    const handleTyping = ({ userId, isTyping }) => {
      if (userId?.toString() !== currentUserId) {
        setOtherTyping(isTyping);
      }
    };

    const handleMessageError = ({ message }) => {
      setError(message || 'Message failed to send');
      setSending(false);
    };

    socket.emit('joinConversation', conversationId);
    socket.on('newMessage', handleNewMessage);
    socket.on('messagesRead', handleMessagesRead);
    socket.on('userTyping', handleTyping);
    socket.on('messageError', handleMessageError);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('messagesRead', handleMessagesRead);
      socket.off('userTyping', handleTyping);
      socket.off('messageError', handleMessageError);
      socket.emit('leaveConversation', conversationId);
      setOtherTyping(false);
    };
  }, [socket, conversationId, currentUserId, markConversationRead]);

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (socket && typing) {
      socket.emit('typing', { conversationId, isTyping: false });
    }

    setTyping(false);
  }, [socket, typing, conversationId]);

  const handleSend = async (e) => {
    e.preventDefault();
    const content = newMessage.trim();

    if (!content || sending) return;

    try {
      setSending(true);
      setError('');

      // HTTP-first send guarantees persistence even when socket is unstable.
      const res = await api.post(`/messages/conversations/${conversationId}/messages`, { content });
      const savedMessage = res.data.data;
      setMessages((prev) => upsertMessage(prev, savedMessage));

      setNewMessage('');
      stopTyping();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to send message';
      setError(message);
    } finally {
      setSending(false);
    }
  };

  const handleTypingChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    if (!socket) return;

    const hasText = value.trim().length > 0;

    if (hasText && !typing) {
      setTyping(true);
      socket.emit('typing', { conversationId, isTyping: true });
    }

    if (!hasText) {
      stopTyping();
      return;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (socket) socket.emit('typing', { conversationId, isTyping: false });
      setTyping(false);
      typingTimeoutRef.current = null;
    }, 1200);
  };

  useEffect(() => () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-dark" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card border-0 shadow-sm" style={{ height: '70vh', display: 'flex', flexDirection: 'column' }}>
      {error && (
        <div className="alert alert-danger border-0 m-3 mb-0" role="alert">
          <i className="fas fa-exclamation-circle me-2"></i>{error}
        </div>
      )}

      <div className="flex-grow-1 overflow-auto p-4" style={{ backgroundColor: '#f8f9fa' }}>
        {!messages.length && (
          <div className="text-center py-5">
            <i className="fas fa-comment-dots fa-3x text-muted mb-3"></i>
            <p className="text-muted">No messages yet. Start the conversation.</p>
          </div>
        )}

        {messages.map((msg) => {
          const senderId = getSenderId(msg);
          const mine = senderId === currentUserId;

          return (
            <div key={msg._id} className={`d-flex ${mine ? 'justify-content-end' : 'justify-content-start'} mb-3`}>
              <div
                className={`p-3 rounded ${mine ? 'bg-dark text-white' : 'bg-white shadow-sm'}`}
                style={{ maxWidth: '70%' }}
              >
                <p className="mb-1">{msg.content}</p>
                <small className={mine ? 'text-white-50' : 'text-muted'}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {mine && msg.readBy.length > 1 && ' ✓✓'}
                </small>
              </div>
            </div>
          );
        })}

        {otherTyping && (
          <div className="text-muted small">
            <i className="fas fa-ellipsis-h"></i> Someone is typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="border-top bg-white p-3">
        <div className="input-group">
          <input
            type="text"
            className="form-control border-0 bg-light"
            placeholder="Type a message..."
            value={newMessage}
            onChange={handleTypingChange}
            maxLength={2000}
          />
          <button className="btn btn-dark" type="submit" disabled={sending || !newMessage.trim()}>
            {sending ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className="fas fa-paper-plane"></i>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;