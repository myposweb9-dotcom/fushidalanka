# Deployment Guide

This application can be deployed to various hosting providers. Choose the one that best fits your needs.

## Prerequisites

1. **Database Migration**: Your app uses SQLite locally. For production, consider:
   - PostgreSQL (recommended for production)
   - MySQL
   - MongoDB
   - Or migrate to a cloud database service

2. **Environment Variables**: Set up these environment variables:
   - `NODE_ENV=production`
   - `PORT=3000` (or provider's default port)
   - Database connection strings
   - Session secrets
   - Any API keys

## Deployment Options

### 0. Firebase (Recommended for full-stack deployment)

**Pros**: Serverless functions, hosting, database, storage all in one
**Cons**: Requires Firebase project setup, can be complex for beginners

**Prerequisites**:
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Install Firebase CLI: `npm install -g firebase-tools`
3. Login: `firebase login`
4. Initialize project: `firebase init` (select Functions and Hosting)

**Steps**:
1. **Authenticate**: Run `firebase login` in your terminal
2. **Initialize Project** (if not done):
   ```bash
   firebase init
   # Select: Functions and Hosting
   # Choose existing project or create new
   # Select JavaScript for functions
   # Use ESLint: No
   # Install dependencies: Yes
   ```
3. **Configure Functions**:
   - Functions are already set up in `functions/` directory
   - Package.json is configured for Node.js 18
   - Express app is exported as Firebase function
4. **Deploy**:
   ```bash
   firebase deploy
   ```
5. **Set Environment Variables**:
   ```bash
   firebase functions:config:set app.node_env="production"
   firebase functions:config:set app.port="3000"
   firebase functions:config:set app.session_secret="your-secret"
   # Add other environment variables as needed
   ```

**Configuration**: `firebase.json` and `functions/` are already configured.

**Database**: For production, migrate from SQLite to Firestore or Cloud SQL.

### 1. Vercel (Recommended for quick deployment)

**Pros**: Fast, easy, great for Node.js apps
**Cons**: Limited database options, file storage needs configuration

**Steps**:
1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel`
4. Set environment variables in Vercel dashboard

**Configuration**: `vercel.json` is already configured.

### 2. Railway

**Pros**: Easy database setup, persistent storage
**Cons**: Can be expensive for high traffic

**Steps**:
1. Go to [Railway.app](https://railway.app)
2. Connect your GitHub repository
3. Railway will auto-detect and deploy
4. Add environment variables in dashboard
5. Set up PostgreSQL database if needed

**Configuration**: `railway.json` is configured for Railway.

### 3. Render

**Pros**: Free tier available, PostgreSQL support
**Cons**: Cold starts, limited free resources

**Steps**:
1. Go to [Render.com](https://render.com)
2. Connect your GitHub repository
3. Choose "Web Service"
4. Configure build and start commands
5. Add environment variables
6. Deploy

**Configuration**: `render.yaml` is configured for Render.

### 4. Heroku

**Pros**: Mature platform, add-ons ecosystem
**Cons**: Expensive, slower deployments

**Steps**:
1. Install Heroku CLI: `npm i -g heroku`
2. Login: `heroku login`
3. Create app: `heroku create your-app-name`
4. Set environment variables: `heroku config:set KEY=value`
5. Deploy: `git push heroku main`

**Configuration**: `Procfile` is configured for Heroku.

### 5. DigitalOcean App Platform

**Pros**: Good performance, reasonable pricing
**Cons**: More complex setup

**Steps**:
1. Go to DigitalOcean App Platform
2. Connect your repository
3. Configure build and run commands
4. Set environment variables
5. Deploy

### 6. AWS/GCP/Azure

**Pros**: Scalable, enterprise-ready
**Cons**: Complex setup, higher costs

Use services like:
- AWS: Elastic Beanstalk, EC2, or Lambda
- GCP: App Engine or Cloud Run
- Azure: App Service

## Database Setup

For production, replace SQLite with a proper database:

### PostgreSQL (Recommended)
```bash
# Install sequelize-cli globally if not already
npm install -g sequelize-cli

# Update config/database.js to use PostgreSQL
# Set DATABASE_URL environment variable
```

### Environment Variables Template
```bash
NODE_ENV=production
PORT=3000
SESSION_SECRET=your-secret-key
DATABASE_URL=postgresql://user:password@host:port/database
# Add other API keys as needed
```

## File Storage

Your app handles file uploads. For production:
- Use cloud storage (AWS S3, Google Cloud Storage, etc.)
- Or configure the hosting provider's persistent storage

## Post-Deployment Checklist

- [ ] Test all routes and functionality
- [ ] Verify database connections
- [ ] Check file upload functionality
- [ ] Test user authentication
- [ ] Verify email functionality (if any)
- [ ] Check admin panel access
- [ ] Test contact forms
- [ ] Verify responsive design

## Troubleshooting

**Common Issues**:
1. **Port issues**: Use `process.env.PORT || 3000`
2. **Database connection**: Ensure DATABASE_URL is set correctly
3. **File uploads**: Check storage permissions
4. **Session issues**: Ensure SESSION_SECRET is set
5. **Build failures**: Check Node.js version compatibility

**Logs**: Check your hosting provider's logs for debugging.
