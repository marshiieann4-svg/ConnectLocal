# 🌍 ConnectLocal - Community Help Platform

A community-driven platform connecting verified helpers with people who need assistance in Mbombela's rural areas and beyond.

**Status**: ✅ **READY FOR DEPLOYMENT**  
**Last Updated**: March 9, 2026

---

## 🎯 Project Overview

ConnectLocal is a comprehensive community platform that enables:
- **Individual helpers** to offer and commercialize their skills
- **Organizations** (NGOs, care centers) to manage clients and services
- **Requesters** to find verified, trustworthy help
- **Community members** to build their reputation through gamification

### Key Features

✅ **User Management**
- Phone-based registration and login
- Individual and Organization accounts
- Role-based access control
- Profile verification levels

✅ **Messaging System**
- Real-time chat between users
- HTTP + WebSocket dual-delivery (reliable & fast)
- Unread message counts
- Typing indicators
- Message history

✅ **Service Management**
- Post and browse services
- Search and filter
- Service details and booking
- Ratings and reviews

✅ **Gamification**
- Community points system
- Achievement badges
- Leaderboard
- Experience levels

✅ **Safety & Verification**
- Safety check-ins
- ID verification framework
- Verification levels (0-3)
- Safety log records

✅ **Admin Portal**
- User management
- Service moderation
- Statistics and analytics
- Admin dashboard

✅ **Modern UI/UX**
- Minimal monotone design (black/white/gray)
- Collapsible sidebar navigation
- Mobile-responsive layout
- Bootstrap styling
- Icon-based interface

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- npm or yarn
- MongoDB Atlas account (configured)
- Modern web browser

### Installation & Running

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Start servers (in separate terminals)

# Terminal 1: Backend
cd backend
npm run dev
# Backend runs on http://localhost:5000

# Terminal 2: Frontend
cd frontend
npm run dev
# Frontend runs on http://localhost:5173
```

**Access**: Open http://localhost:5173 in your browser

### First Time
1. Click **Register** 
2. Fill in required fields (Name, Phone, Ward)
3. Choose account type (Individual/Organization)
4. Click **Register** (auto-login)
5. Explore the dashboard!

See [QUICKSTART.md](QUICKSTART.md) for detailed guide.

---

## 📁 Project Structure

```
ConnectLocal/
├── backend/                 # Node.js + Express server
│   ├── controllers/        # Business logic
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API endpoints
│   ├── middleware/        # Auth, validation, etc.
│   ├── config/            # Database connection
│   ├── utils/             # Helper functions
│   └── server.js          # Main server file
│
├── frontend/              # React + Vite client
│   ├── src/
│   │   ├── components/   # Reusable React components
│   │   ├── pages/        # Full page components
│   │   ├── services/     # API client (axios)
│   │   ├── context/      # Socket.IO context
│   │   ├── utils/        # Helper functions
│   │   ├── App.jsx       # Main app component
│   │   └── main.jsx      # Entry point
│   └── dist/             # Production build
│
├── docs/                 # Documentation
├── DEPLOYMENT.md         # Production deployment guide
├── PRODUCTION.md         # Production environment config
├── QUICKSTART.md         # Quick start guide
└── README.md            # This file
```

---

## 🔧 Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Atlas
- **Authentication**: JWT tokens
- **Real-time**: Socket.IO
- **Security**: Helmet.js, CORS, Rate limiting
- **Validation**: Custom middleware

### Frontend
- **Library**: React 18+
- **Build Tool**: Vite
- **Routing**: React Router
- **HTTP Client**: Axios
- **Real-time**: Socket.IO client
- **UI Framework**: Bootstrap 5
- **Icons**: Font Awesome

---

## 📊 API Endpoints

### Authentication
```
POST   /api/auth/register      Register new user
POST   /api/auth/login         Login with phone
GET    /api/auth/me            Get current user (protected)
```

### Users
```
GET    /api/users/profile      Get own profile (protected)
GET    /api/users/:id          Get user by ID
PUT    /api/users/profile      Update profile (protected)
```

### Services
```
GET    /api/services           List all services
POST   /api/services           Create service (protected)
GET    /api/services/:id       Get service details
PUT    /api/services/:id       Update service (protected)
DELETE /api/services/:id       Delete service (protected)
```

### Messages
```
POST   /api/messages/conversations           Create conversation
GET    /api/messages/conversations           List conversations
POST   /api/messages/conversations/:id/messages     Send message
POST   /api/messages/conversations/:id/read         Mark as read
```

### Ratings
```
GET    /api/ratings/user/:id   Get user ratings
POST   /api/ratings            Create rating (protected)
```

### Gamification
```
GET    /api/gamification/user/:id      Get points & badges
GET    /api/gamification/leaderboard   Get top users
```

See API documentation for full endpoint list.

---

## 🧪 Testing

All major features have been tested:

- ✅ User registration and login
- ✅ Profile creation and editing
- ✅ Messaging between users
- ✅ Real-time notifications
- ✅ Service listing and details
- ✅ Rating system
- ✅ Sidebar navigation
- ✅ Mobile responsiveness
- ✅ Error handling

See [DEPLOYMENT.md](DEPLOYMENT.md) for full testing checklist.

---

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
# Backend
cd backend
npm install --production
NODE_ENV=production npm start

# Frontend  
cd frontend
npm run build
# Serve /dist folder via web server
```

For detailed deployment instructions, see:
- [DEPLOYMENT.md](DEPLOYMENT.md) - Comprehensive checklist
- [PRODUCTION.md](PRODUCTION.md) - Environment setup & security

---

## 📝 Features & Status

| Feature | Status | Notes |
|---------|--------|-------|
| User Registration | ✅ Working | Phone-based, multiple account types |
| Login | ✅ Working | Phone + JWT tokens |
| Messaging | ✅ Working | HTTP + WebSocket, real-time |
| Profiles | ✅ Working | Editable bio and skills |
| Services | ✅ Working | CRUD operations |
| Ratings | ✅ Working | Store and display ratings |
| Verification | ✅ Working | ID, police, verification levels |
| Gamification | ✅ Working | Points, badges, leaderboard |
| Admin Panel | ✅ Working | Manage users and content |
| Safety | ✅ Working | Check-ins and logging |
| Mobile UI | ✅ Working | Responsive design, sidebar menu |

---

## 🔒 Security

- ✅ HTTPS ready
- ✅ JWT authentication
- ✅ CORS configured
- ✅ Rate limiting (1000 req/min for dev)
- ✅ Input validation
- ✅ XSS protection via React
- ✅ Helmet.js security headers
- ✅ MongoDB connection over TLS

**Production Recommendations**:
- Update JWT_SECRET to strong random value
- Enable HTTPS only
- Reduce rate limits to 500 req/min
- Set up monitoring and logging
- Configure backups and failover

---

## 🐛 Known Issues & Limitations

- Phone-only authentication (password-based auth not yet implemented)
- Email verification not yet implemented
- No automated SMS sending (ready for integration)
- Limited mobile app optimization
- No payment processing yet

---

## 🎯 Future Enhancements

- [ ] Password-based authentication option
- [ ] Email verification and password reset
- [ ] Push notifications
- [ ] Advanced search and filters
- [ ] Image compression for uploads
- [ ] Mobile app (React Native)
- [ ] Analytics dashboard
- [ ] Payment processing
- [ ] Multi-language support
- [ ] Offline mode (PWA)

---

## 👥 Contributing

To contribute to ConnectLocal:

1. Clone the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📞 Support & Troubleshooting

### Common Issues

**Can't register?**
- Check all required fields are filled
- Verify phone number doesn't already exist
- Check browser console for error messages

**Messages not working?**
- Ensure both servers are running
- Check Socket.IO connection in DevTools
- Try refreshing the page

**Profile not saving?**
- Verify you're logged in
- Check console for API errors
- Ensure all required fields are filled

**Rate limit errors (429)?**
- Already fixed! Limit is generous for development
- For stricter limit, adjust in `.env`

See [QUICKSTART.md](QUICKSTART.md) for more troubleshooting.

---

## 📄 License

Copyright © 2026 ConnectLocal. All rights reserved.

---

## 🎉 Ready to Deploy!

All features are functional and tested. See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment steps.

**Last Updated**: March 9, 2026
**Status**: ✅ Production Ready
