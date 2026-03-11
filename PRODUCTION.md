# Production Environment Template

## Backend .env (Production)

```bash
# Server Configuration
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster.mongodb.net/connectlocal?retryWrites=true&w=majority

# JWT - Change these to secure random values!
JWT_SECRET=your-super-secret-key-min-32-chars-change-this
JWT_EXPIRE=7d

# Rate Limiting - Adjust for production
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=500

# Email (if implementing email notifications)
EMAIL_FROM=noreply@connectlocal.io
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload
MAX_FILE_SIZE=5242880  # 5MB
ALLOWED_EXTENSIONS=jpg,jpeg,png,pdf,doc,docx

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/connectlocal/app.log
```

## Frontend Environment Variables

Create `frontend/.env.production`:
```bash
VITE_API_URL=https://api.connectlocal.io
VITE_SOCKET_URL=https://api.connectlocal.io
VITE_ENV=production
```

## Security Checklist for Production

### 1. Environment Variables ✅
- [ ] JWT_SECRET is at least 32 random characters
- [ ] All credentials are environment variables (not in code)
- [ ] .env files are in .gitignore
- [ ] Different secrets for dev and prod

### 2. HTTPS ✅
- [ ] SSL certificate installed
- [ ] HTTPS enforced (redirect HTTP → HTTPS)
- [ ] Certificate auto-renewal set up
- [ ] Mixed content warnings resolved

### 3. Database ✅
- [ ] MongoDB connection uses SSL
- [ ] Database backups configured (daily)
- [ ] Connection pooling optimized
- [ ] Indexes created on frequently queried fields

### 4. Authentication ✅
- [ ] JWT token expiration set appropriately (7 days)
- [ ] Token refresh mechanism considered
- [ ] Password reset flow implemented
- [ ] Account lock-out after failed attempts

### 5. Rate Limiting ✅
- [ ] Stricter limits for auth endpoints (50 req/min)
- [ ] Standard limits for API endpoints (500 req/min)
- [ ] IP-based rate limiting for abuse prevention
- [ ] DDoS protection via Cloudflare or similar

### 6. Data Protection ✅
- [ ] Sensitive data not logged
- [ ] User passwords hashed (if stored)
- [ ] Personal data encryption at rest
- [ ] GDPR compliance implemented

### 7. Error Handling ✅
- [ ] No stack traces in production errors
- [ ] Generic error messages to users
- [ ] Detailed errors logged server-side
- [ ] Error monitoring (Sentry, LogRocket, etc.)

### 8. API Security ✅
- [ ] CORS properly configured
- [ ] API versioning implemented
- [ ] Input validation on all endpoints
- [ ] Output sanitization for XSS prevention

---

## Production Deployment Commands

### Backend Deployment
```bash
cd backend

# Install production dependencies
npm install --production

# Run migrations (if any)
npm run migrate

# Start server
NODE_ENV=production PORT=5000 npm start

# Or use process manager (PM2)
pm2 start server.js --name "connectlocal-api" --env production
```

### Frontend Deployment
```bash
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# Serve static files (example with Node.js)
npm install -g serve
serve -s dist -l 3000

# Or use Nginx (recommended)
# Copy dist/ contents to /var/www/connectlocal
```

### Nginx Configuration Example

```nginx
server {
    listen 443 ssl http2;
    server_name api.connectlocal.io;
    
    ssl_certificate /etc/ssl/certs/connectlocal.crt;
    ssl_certificate_key /etc/ssl/private/connectlocal.key;
    
    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Socket.IO
    location /socket.io {
        proxy_pass http://localhost:5000/socket.io;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

server {
    listen 443 ssl http2;
    server_name app.connectlocal.io;
    
    ssl_certificate /etc/ssl/certs/connectlocal.crt;
    ssl_certificate_key /etc/ssl/private/connectlocal.key;
    
    # Frontend
    location / {
        root /var/www/connectlocal/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name api.connectlocal.io app.connectlocal.io;
    return 301 https://$server_name$request_uri;
}
```

---

## Monitoring & Logging

### Application Logging
```javascript
// Use structured logging in production
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Error Tracking
Consider using:
- Sentry (error tracking)
- LogRocket (user session recording)
- New Relic (performance monitoring)
- DataDog (infrastructure monitoring)

### Health Checks
Add monitoring endpoint:
```javascript
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});
```

---

## Backup & Recovery

### Database Backups
```bash
# MongoDB Atlas - Enable automatic backups in dashboard
# Or use mongodump for manual backups

mongodump --uri "mongodb+srv://username:password@cluster.mongodb.net/connectlocal" \
  --out /backups/connectlocal-$(date +%Y%m%d)
```

### File Backups
- Upload user files to AWS S3 or similar cloud storage
- Implement versioning for critical files
- Regular backup verification

---

## Performance Optimization

### Frontend Optimization
- [ ] Minify and bundle JavaScript
- [ ] Compress images
- [ ] Enable gzip compression
- [ ] Set up CDN for static assets
- [ ] Lazy load components and images

### Backend Optimization
- [ ] Database indexing on frequently queried fields
- [ ] Caching (Redis for sessions, API responses)
- [ ] Connection pooling
- [ ] Query optimization
- [ ] Load balancing (for multi-server setup)

---

## Rollback Plan

In case of issues:
1. Keep previous version in deployment
2. Database: Have backup from before deployment
3. Static files: Keep previous build
4. Process: git revert & redeploy if needed

---

Last Updated: March 9, 2026
