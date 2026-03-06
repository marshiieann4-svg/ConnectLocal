// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken'); // for socket authentication
const User = require('./models/User'); // adjust path if needed

dotenv.config();

const app = express();

// Connect to MongoDB
const connectDB = require('./config/database');
connectDB();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Security headers
app.use(helmet());

// CORS configuration
const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Logging
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Import route modules
const authRoutes = require('./routes/authRoutes');
const serviceRoutes = require('./routes/servicesRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const safetyRoutes = require('./routes/safetyRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const statsRoutes = require('./routes/statsRoutes');
const clientRoutes = require('./routes/clientRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const gamificationRoutes = require('./routes/gamificationRoutes');
const messageRoutes = require('./routes/messageRoutes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/verifications', verificationRoutes);
app.use('/api/safety', safetyRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/messages', messageRoutes); 

// Home route
app.get('/', (req, res) => {
  res.json({
    message: '🚀 ConnectLocal API is running',
    version: '1.0.0',
    endpoints: {
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      profile: 'GET /api/auth/me (protected)',
      services: 'GET /api/services',
      createService: 'POST /api/services',
      ratings: 'GET /api/ratings/user/:userId',
      safety: 'POST /api/safety/checkin'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Create HTTP server
const server = http.createServer(app);

// Socket.IO setup
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

// Socket authentication middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-__v');
    if (!user) return next(new Error('User not found'));
    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`User ${socket.user._id} connected`);

  socket.join(`user:${socket.user._id}`);

  socket.on('joinConversation', (conversationId) => {
    socket.join(`conversation:${conversationId}`);
  });

  socket.on('leaveConversation', (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
  });

  socket.on('sendMessage', async (data) => {
    try {
      const { conversationId, content } = data;
      const Conversation = require('./models/Conversation');
      const Message = require('./models/Message');

      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        socket.emit('error', { message: 'Conversation not found' });
        return;
      }
      if (!conversation.participants.includes(socket.user._id)) {
        socket.emit('error', { message: 'Not authorized' });
        return;
      }

      const message = await Message.create({
        conversationId,
        senderId: socket.user._id,
        content,
        readBy: [socket.user._id]
      });

      conversation.lastMessage = message._id;
      conversation.lastMessageAt = new Date();
      await conversation.save();

      const populatedMessage = await Message.findById(message._id).populate('senderId', 'name');

      io.to(`conversation:${conversationId}`).emit('newMessage', populatedMessage);

      const otherParticipant = conversation.participants.find(
        p => p.toString() !== socket.user._id.toString()
      );
      io.to(`user:${otherParticipant}`).emit('newMessageNotification', { conversationId, message: populatedMessage });

    } catch (error) {
      console.error(error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('markAsRead', async ({ conversationId }) => {
    try {
      const Message = require('./models/Message');
      await Message.updateMany(
        { conversationId, readBy: { $ne: socket.user._id } },
        { $addToSet: { readBy: socket.user._id } }
      );
      io.to(`conversation:${conversationId}`).emit('messagesRead', { userId: socket.user._id, conversationId });
    } catch (error) {
      console.error(error);
    }
  });

  socket.on('typing', ({ conversationId, isTyping }) => {
    socket.to(`conversation:${conversationId}`).emit('userTyping', { userId: socket.user._id, isTyping });
  });

  socket.on('disconnect', () => {
    console.log(`User ${socket.user._id} disconnected`);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}\n`);
});