# PostgreSQL Setup Guide

Your application has been updated from SQLite to PostgreSQL. Here's how to set it up:

## Prerequisites

- PostgreSQL 12+ installed
- Node.js 18+

## Local Development Setup

### 1. Install PostgreSQL

**Windows**:
- Download from https://www.postgresql.org/download/windows/
- Install with default settings
- Remember the password you set for the `postgres` user

**Mac**:
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu/Debian)**:
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create a Local Database

**Using psql (Command line)**:
```bash
# Connect to PostgreSQL (Windows)
psql -U postgres

# Or on Mac/Linux
sudo -u postgres psql
```

Then run:
```sql
CREATE DATABASE fushidhalanka;
CREATE USER fushidhalanka WITH PASSWORD 'your-secure-password';
ALTER ROLE fushidhalanka SET client_encoding TO 'utf8';
ALTER ROLE fushidhalanka SET default_transaction_isolation TO 'read committed';
ALTER ROLE fushidhalanka SET default_transaction_deferrable TO on;
ALTER ROLE fushidhalanka SET default_transaction_read_only TO off;
ALTER ROLE fushidhalanka SET idle_in_transaction_session_timeout TO 0;
ALTER ROLE fushidhalanka CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE fushidhalanka TO fushidhalanka;
\q
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
NODE_ENV=development
PORT=3000
SESSION_SECRET=your-random-secret-key-here

# PostgreSQL Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fushidhalanka
DB_USER=fushidhalanka
DB_PASSWORD=your-secure-password

# Admin User
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Your App

```bash
node server.js
```

On first run:
- Tables will be created automatically
- Default admin user will be created
- Seed data (logos) will be added

## Digital Ocean Production Setup

### 1. Create PostgreSQL Database

1. Go to [DigitalOcean Dashboard](https://cloud.digitalocean.com)
2. Click **Databases** → **Create Database Cluster**
3. Choose:
   - **Engine**: PostgreSQL
   - **Version**: 15 (or latest)
   - **Region**: Your preferred region
   - **Cluster Name**: `fushidhalanka-db`

4. **Get Connection String**:
   - Copy the "Connection string" 
   - It looks like: `postgresql://doadmin:..@host:port/defaultdb`

### 2. Create Database and User

In DigitalOcean database console:

```sql
CREATE DATABASE fushidhalanka;
CREATE USER fushidhalanka WITH PASSWORD 'secure-password';
GRANT ALL PRIVILEGES ON DATABASE fushidhalanka TO fushidhalanka;
```

### 3. Set Environment Variables in Digital Ocean App

In your DigitalOcean App Platform:

```
DATABASE_URL=postgresql://fushidhalanka:password@host:25060/fushidhalanka
NODE_ENV=production
PORT=3000
SESSION_SECRET=your-secure-random-string
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=secure-password
```

**Important**: 
- Keep `DATABASE_URL` private in Digital Ocean secrets
- Don't commit `.env` to git (it's in `.gitignore`)

## Migrating Data from SQLite (if you have existing data)

If you have data in the SQLite database:

### Option 1: Using a Migration Script

```bash
# This exports SQLite data and imports to PostgreSQL
# Contact support for the migration script
```

### Option 2: Manual Data Transfer

1. Export from SQLite database
2. Transform format if needed
3. Import to PostgreSQL

### Option 3: Fresh Start

- Delete old SQLite database
- New tables created automatically on app start
- Re-add data manually or via admin panel

## Testing Connection

Run this in your terminal:

```bash
# On Windows, you'll need to have psql installed (comes with PostgreSQL)
psql -h localhost -U fushidhalanka -d fushidhalanka -c "SELECT version();"
```

If successful, you'll see the PostgreSQL version.

## Troubleshooting

### Connection Refused
- Check PostgreSQL is running: `brew services list` (Mac) or Services (Windows)
- Verify credentials in `.env`
- Check port 5432 is open

### Database Already Exists
```sql
DROP DATABASE fushidhalanka;
-- Then recreate as shown above
```

### Password Authentication Failed
- Reset PostgreSQL password:
```bash
# Windows: Use pgAdmin (installed with PostgreSQL)
# Mac/Linux:
sudo -u postgres psql
ALTER USER fushidhalanka WITH PASSWORD 'new-password';
```

## Package Dependencies

Ensure your `package.json` has:
```json
{
  "pg": "^8.16.3",
  "sequelize": "^6.37.7"
}
```

Both are already in your project! ✅

## Performance Tips

For production, consider:

1. **Add database indexes** on frequently queried columns
2. **Enable connection pooling** (already configured in database.js)
3. **Regular backups** (Daily in DigitalOcean)
4. **Monitor database size** and connections
5. **Use read replicas** for high-traffic setups

## Next Steps

1. ✅ Update database.js (Done)
2. ✅ Create .env.example (Done)
3. Set up local PostgreSQL
4. Update your .env file
5. Test locally: `node server.js`
6. Deploy to Digital Ocean with DATABASE_URL

## Support

If you encounter issues:

1. Check logs: `digital-ocean-app logs`
2. Verify DATABASE_URL is correct
3. Ensure database user has all permissions
4. Check node version: `node --version`
