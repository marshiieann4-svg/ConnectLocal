const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();
const { protect } = require('../middleware/auth');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

const toObjectId = (id) => new mongoose.Types.ObjectId(id);

const isParticipant = (conversation, userId) =>
  conversation.participants.some((participantId) => participantId.toString() === userId.toString());

const buildUnreadCountMap = async (userId, conversationIds) => {
  if (!conversationIds.length) return new Map();

  const unreadRows = await Message.aggregate([
    {
      $match: {
        conversationId: { $in: conversationIds.map((id) => toObjectId(id)) },
        senderId: { $ne: toObjectId(userId) },
        readBy: { $ne: toObjectId(userId) }
      }
    },
    {
      $group: {
        _id: '$conversationId',
        count: { $sum: 1 }
      }
    }
  ]);

  return new Map(unreadRows.map((row) => [row._id.toString(), row.count]));
};

// Get all conversations for the current user
router.get('/conversations', protect, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id
    })
      .populate('participants', 'name profilePicture')
      .populate({ path: 'lastMessage', populate: { path: 'senderId', select: 'name profilePicture' } })
      .sort('-lastMessageAt');

    const unreadMap = await buildUnreadCountMap(
      req.user.id,
      conversations.map((conv) => conv._id.toString())
    );

    const data = conversations.map((conv) => ({
      ...conv.toObject(),
      unreadCount: unreadMap.get(conv._id.toString()) || 0
    }));

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get messages for a specific conversation
router.get('/conversations/:conversationId/messages', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    if (!isParticipant(conversation, req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const messages = await Message.find({ conversationId: req.params.conversationId })
      .populate('senderId', 'name profilePicture')
      .sort('createdAt');

    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Send a message via HTTP (fallback when socket is unavailable)
router.post('/conversations/:conversationId/messages', protect, async (req, res) => {
  try {
    const content = String(req.body?.content || '').trim();

    if (!content) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    if (content.length > 2000) {
      return res.status(400).json({ success: false, message: 'Message is too long (max 2000 chars)' });
    }

    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    if (!isParticipant(conversation, req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const message = await Message.create({
      conversationId: conversation._id,
      senderId: req.user.id,
      content,
      readBy: [req.user.id]
    });

    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    conversation.updatedAt = new Date();
    await conversation.save();

    const populatedMessage = await Message.findById(message._id).populate('senderId', 'name profilePicture');

    // Mirror socket behavior so both live and HTTP sends stay consistent.
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation:${conversation._id}`).emit('newMessage', populatedMessage);

      const otherParticipant = conversation.participants.find(
        (participantId) => participantId.toString() !== req.user.id.toString()
      );

      if (otherParticipant) {
        io.to(`user:${otherParticipant.toString()}`).emit('newMessageNotification', {
          conversationId: conversation._id.toString(),
          message: populatedMessage,
          unreadIncrement: 1
        });
      }
    }

    res.status(201).json({ success: true, data: populatedMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark all messages in a conversation as read for current user
router.post('/conversations/:conversationId/read', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    if (!isParticipant(conversation, req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Message.updateMany(
      { conversationId: conversation._id, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );

    const io = req.app.get('io');
    if (io) {
      io.to(`conversation:${conversation._id}`).emit('messagesRead', {
        userId: req.user.id,
        conversationId: conversation._id.toString()
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Start a new conversation (or get existing one)
router.post('/conversations', protect, async (req, res) => {
  try {
    const { otherUserId, serviceId } = req.body;

    if (!otherUserId) {
      return res.status(400).json({ success: false, message: 'otherUserId is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({ success: false, message: 'Invalid otherUserId' });
    }

    if (serviceId && !mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({ success: false, message: 'Invalid serviceId' });
    }

    if (otherUserId.toString() === req.user.id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot create a conversation with yourself' });
    }

    const otherUser = await User.findById(otherUserId).select('_id isActive');
    if (!otherUser || otherUser.isActive === false) {
      return res.status(404).json({ success: false, message: 'Recipient user not found' });
    }

    const participants = [req.user.id.toString(), otherUserId.toString()].sort();
    const participantsKey = participants.join(':');

    let conversation = await Conversation.findOne({
      participantsKey,
      ...(serviceId ? { serviceId } : {})
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user.id, otherUserId],
        participantsKey,
        serviceId: serviceId || null,
        lastMessageAt: new Date()
      });
    }

    const populated = await Conversation.findById(conversation._id)
      .populate('participants', 'name profilePicture')
      .populate({ path: 'lastMessage', populate: { path: 'senderId', select: 'name profilePicture' } });

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: 'Conversation already exists. Please retry.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;