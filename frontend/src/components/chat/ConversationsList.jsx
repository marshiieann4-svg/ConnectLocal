import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import { useSocket } from '../../context/socket-context';

const ConversationsList = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('newMessageNotification', ({ conversationId, message }) => {
      // Update conversations list (e.g., move to top, update last message)
      setConversations(prev =>
        prev.map(conv =>
          conv._id === conversationId
            ? { ...conv, lastMessage: message, lastMessageAt: message.createdAt }
            : conv
        )
      );
    });
    return () => socket.off('newMessageNotification');
  }, [socket]);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/messages/conversations');
      setConversations(res.data.data);
    } catch (error) {
      console.error('Failed to load conversations', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="list-group">
      {conversations.map(conv => {
        const other = conv.participants.find(p => p._id !== localStorage.getItem('userId'));
        return (
          <Link
            key={conv._id}
            to={`/chat/${conv._id}`}
            className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
          >
            <div>
              <strong>{other?.name}</strong>
              <p className="mb-0 text-muted small">{conv.lastMessage?.content?.substring(0, 30)}...</p>
            </div>
            <small className="text-muted">
              {new Date(conv.lastMessageAt).toLocaleDateString()}
            </small>
          </Link>
        );
      })}
    </div>
  );
};

export default ConversationsList;