import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import api from '../../services/api';
import { useSocket } from '../../context/socket-context';

const getTime = (conversation) => conversation.lastMessageAt || conversation.updatedAt || conversation.createdAt || 0;

const sortByLatest = (items) => [...items].sort((a, b) => new Date(getTime(b)) - new Date(getTime(a)));

const ConversationsList = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const socket = useSocket();
  const location = useLocation();
  const currentUserId = localStorage.getItem('userId');

  const activeConversationId = useMemo(() => {
    const match = location.pathname.match(/^\/chat\/([^/]+)$/);
    return match ? match[1] : null;
  }, [location.pathname]);

  const fetchConversations = useCallback(async () => {
    try {
      setError('');
      const res = await api.get('/messages/conversations');
      setConversations(sortByLatest(res.data.data || []));
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load conversations';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!socket) return;

    const handleNotification = ({ conversationId, message, unreadIncrement = 1 }) => {
      setConversations((prev) => {
        const idx = prev.findIndex((conv) => conv._id === conversationId);

        if (idx === -1) {
          // If conversation isn't in local list yet, refresh from API.
          fetchConversations();
          return prev;
        }

        const current = prev[idx];
        const increment = activeConversationId === conversationId ? 0 : unreadIncrement;
        const updated = {
          ...current,
          lastMessage: message,
          lastMessageAt: message.createdAt,
          unreadCount: Math.max((current.unreadCount || 0) + increment, 0)
        };

        const next = [...prev];
        next[idx] = updated;
        return sortByLatest(next);
      });
    };

    socket.on('newMessageNotification', handleNotification);

    return () => {
      socket.off('newMessageNotification', handleNotification);
    };
  }, [socket, activeConversationId, fetchConversations]);

  useEffect(() => {
    if (!activeConversationId) return;

    setConversations((prev) =>
      prev.map((conv) =>
        conv._id === activeConversationId
          ? { ...conv, unreadCount: 0 }
          : conv
      )
    );
  }, [activeConversationId]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-dark" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger border-0 shadow-sm" role="alert">
        <i className="fas fa-exclamation-circle me-2"></i>{error}
      </div>
    );
  }

  if (!conversations.length) {
    return (
      <div className="text-center py-5">
        <i className="fas fa-comments fa-3x text-muted mb-3"></i>
        <p className="text-muted">No conversations yet.</p>
        <p className="small text-muted">Visit a profile and start messaging someone!</p>
      </div>
    );
  }

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-white border-bottom">
        <h5 className="mb-0"><i className="fas fa-comments me-2"></i>Messages</h5>
      </div>
      <div className="list-group list-group-flush">
        {conversations.map((conv) => {
          const other = conv.participants.find((participant) => participant._id !== currentUserId);
          const preview = conv.lastMessage?.content || 'No messages yet';
          const unreadCount = conv.unreadCount || 0;

          return (
            <Link
              key={conv._id}
              to={`/chat/${conv._id}`}
              className="list-group-item list-group-item-action border-0 py-3"
              style={{ transition: 'background 0.2s' }}
            >
              <div className="d-flex align-items-start justify-content-between">
                <div className="flex-grow-1 me-3">
                  <div className="d-flex align-items-center mb-1">
                    <strong className="me-2">{other?.name || 'Unknown user'}</strong>
                    {unreadCount > 0 && (
                      <span className="badge bg-dark rounded-pill">{unreadCount}</span>
                    )}
                  </div>
                  <p className="mb-0 text-muted small">{preview.slice(0, 50)}{preview.length > 50 ? '...' : ''}</p>
                </div>
                <small className="text-muted text-nowrap">
                  {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </small>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default ConversationsList;