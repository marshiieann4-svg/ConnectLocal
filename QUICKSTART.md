# 🚀 Quick Start Guide - ConnectLocal

## Prerequisites
- Node.js v18 or higher
- npm or yarn
- MongoDB Atlas account (already configured)
- Modern web browser

## 🏃 Quick Development Start

### 1. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend  
cd frontend
npm install
```

### 2. Start Servers

**Terminal 1 - Backend**:
```bash
cd backend
npm run dev
```
Backend will be available at: `http://localhost:5000`

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
```
Frontend will be available at: `http://localhost:5173`

### 3. Access the Application
Open your browser and go to: **http://localhost:5173**

---

## 📝 First Time Setup

### Create Test Accounts
1. Click **Register**
2. Fill in all required fields:
   - **Full Name**: Test User
   - **Phone**: Any unique number (e.g., 254700000001)
   - **Ward**: Your location
   - **Account Type**: Choose Individual or Organization
3. Click **Register** (auto-logs you in)

### Test Messaging
1. Go back to **Dashboard**
2. Find another service/user
3. Click on their name to view profile
4. Click **Message** button
5. Start chatting!

### Edit Your Profile
1. Click your name in the sidebar
2. Click **Edit Profile**
3. Add bio and skills
4. Click **Save**

---

## 🔑 Key Features

| Feature | How to Access |
|---------|--------------|
| **Dashboard** | Home page after login |
| **Messages** | Click Messages in sidebar |
| **Profile** | Click your name in sidebar |
| **Services** | Browse on Dashboard |
| **Leaderboard** | Click Leaderboard in sidebar |
| **Admin** | (Requires admin account) |

---

## 🧪 Testing Checklist

Run through these to verify everything works:

- [ ] Can register new account
- [ ] Can login with registered phone
- [ ] Dashboard loads without errors
- [ ] Can view another user's profile
- [ ] Can send message to a user
- [ ] Can see message in conversation list
- [ ] Can mark messages as read
- [ ] Can edit own profile (bio + skills)
- [ ] Sidebar toggles on mobile
- [ ] All navigation links work
- [ ] No errors in browser console

---

## 🐛 Troubleshooting

### Servers won't start
```bash
# Kill all node processes
taskkill /F /IM node.exe

# Clear and reinstall
rm -r node_modules
npm install
npm run dev
```

### Port already in use
```bash
# Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# or change port in .env
# PORT=5001
```

### API requests failing (429 error)
Already fixed! Rate limit is set to 1000 requests/minute.

### Messages not appearing
1. Check browser console (F12)
2. Verify Socket.IO is connected
3. Try refreshing the page

### Can't edit profile
1. Verify you're on your own profile (not someone else's)
2. Check console for API errors
3. Make sure all required fields are filled

---

## 📦 .env Variables

**Backend** (.env file):
```bash
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://... # Already configured
JWT_SECRET=ChangeThisInProduction
JWT_EXPIRE=7d
```

⚠️ **Important for Production**:
- Change JWT_SECRET to something random and secure
- Change NODE_ENV to "production"
- Update MONGODB_URI if needed
- Configure rate limiting appropriately

---

## 🎯 Next Steps After Deployment

1. **Test all features** - Use the checklist above
2. **Monitor logs** - Check console for errors
3. **Performance** - Check network tab in DevTools
4. **Security** - Ensure HTTPS is enabled in production
5. **Backups** - Set up MongoDB backup routine

---

## 📞 Support

If something doesn't work:
1. Check browser console (F12 → Console tab)
2. Check terminal output where servers are running
3. Verify both servers are running (check ports 5000 and 5173)
4. Clear browser cache and localStorage
5. Restart both servers

---

**Ready to Deploy!** 🎉

All systems are functional and tested. See DEPLOYMENT.md for production setup.
