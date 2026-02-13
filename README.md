# BC Golf Safaris Team Chat

A mobile-first team chat application built with Next.js, Vercel Postgres, and NextAuth.js.

## Features

- 📱 Mobile-first design optimized for iOS and Android
- 💬 Channel-based messaging
- 📩 Direct messages between team members
- 🔔 Push notifications support
- 👤 User management (admin panel)
- 🔐 Secure authentication with NextAuth.js
- 📊 Postgres database with Prisma ORM

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Vercel Postgres (via Prisma)
- **Authentication:** NextAuth.js (Credentials provider)
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Deployment:** Vercel

## Quick Start

### Prerequisites

- Node.js 18+
- A Vercel account
- Vercel CLI (optional, for local development)

### Setup

1. **Clone and install:**
   ```bash
   git clone https://github.com/lencurrie/bc-golf-chat.git
   cd bc-golf-chat
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Generate a NextAuth secret:
   ```bash
   openssl rand -base64 32
   ```
   
   Add it to `.env.local`:
   ```
   NEXTAUTH_SECRET=your-generated-secret
   NEXTAUTH_URL=http://localhost:3000
   ```

3. **Connect Vercel Postgres:**
   
   Option A - Via Vercel Dashboard:
   - Go to your project in Vercel Dashboard
   - Navigate to Storage → Create Database → Postgres
   - Connect it to your project
   - Pull env vars: `vercel env pull .env.local`
   
   Option B - Via CLI:
   ```bash
   vercel link
   vercel env pull .env.local
   ```

4. **Initialize the database:**
   ```bash
   npx prisma db push
   ```

5. **Create initial admin user:**
   ```bash
   npx prisma studio
   ```
   Or use the signup page and manually set `is_admin = true` in the database.

6. **Run locally:**
   ```bash
   npm run dev
   ```

### Deployment

The app is deployed automatically to Vercel on push to the main branch.

Live URL: https://bc-golf-chat.vercel.app

## Database Schema

- **profiles** - User accounts with admin/active flags
- **channels** - Chat channels
- **channel_members** - Channel membership
- **messages** - Channel messages
- **direct_messages** - Private messages between users
- **push_subscriptions** - Web push notification subscriptions

## API Routes

- `POST /api/auth/signup` - Create account
- `GET/POST /api/messages` - Channel messages
- `GET/POST /api/direct-messages` - Direct messages
- `GET/PATCH /api/admin/users` - User management (admin)
- `GET/POST/DELETE /api/admin/channels` - Channel management (admin)
- `POST/DELETE /api/admin/channel-members` - Member management (admin)
- `POST/DELETE /api/push/subscribe` - Push notifications

## Real-time Updates

Instead of WebSockets, this app uses polling (every 3 seconds) for real-time message updates. This is simpler to deploy on serverless platforms like Vercel.

## Creating the First Admin

1. Sign up via the web interface
2. Open Prisma Studio: `npx prisma studio`
3. Find your user in the `profiles` table
4. Set `is_admin` to `true`
5. Refresh the app

Alternatively, create a user directly in the database:

```sql
INSERT INTO profiles (id, email, password, full_name, is_admin, is_active)
VALUES (
  gen_random_uuid(),
  'admin@example.com',
  '$2a$12$...',  -- bcrypt hash of password
  'Admin User',
  true,
  true
);
```

## License

MIT
