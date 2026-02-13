# BC Golf Safaris Team Chat

A mobile-optimized team chat application built with Next.js 14 and Supabase.

## Features

- 📱 **Mobile-First PWA** - Works great on phones, installable as an app
- 💬 **Real-time Messaging** - Instant message delivery with Supabase Realtime
- 🔔 **Push Notifications** - Get notified of new messages
- 👥 **Channels** - Group conversations for teams
- 🤝 **Direct Messages** - Private 1:1 conversations
- ⚙️ **Admin Panel** - Manage users and channels
- 🔐 **Secure Auth** - Email/password authentication via Supabase

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Auth, Database, Realtime)
- **Deployment**: Vercel

## Setup Instructions

### 1. Supabase Setup

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **SQL Editor** and run the contents of `supabase-schema.sql`
4. Go to **Project Settings > API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Enable Realtime

1. In Supabase, go to **Database > Replication**
2. Enable realtime for these tables:
   - `messages`
   - `direct_messages`
   - `channels`
   - `channel_members`

### 3. Configure Authentication

1. In Supabase, go to **Authentication > Providers**
2. Ensure Email provider is enabled
3. (Optional) Disable email confirmation for faster testing:
   - Go to **Authentication > Email Templates**
   - Or set `GOTRUE_MAILER_AUTOCONFIRM=true`

### 4. Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 5. Create First Admin User

1. Sign up through the app
2. In Supabase SQL Editor, run:
```sql
UPDATE profiles SET is_admin = true WHERE email = 'your-email@example.com';
```

### 6. Add Users to General Channel

After users sign up, add them to the General channel:
```sql
INSERT INTO channel_members (channel_id, user_id)
SELECT '00000000-0000-0000-0000-000000000001', id FROM profiles WHERE is_active = true;
```

Or use the Admin Panel to manage channel membership.

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

## Admin Panel

Admins can:
- Activate/deactivate users
- Promote users to admin
- Create/delete channels
- Manage channel membership

Access at `/admin` (admin users only)

## Mobile Installation (PWA)

**iOS Safari:**
1. Open the chat URL
2. Tap Share button
3. Tap "Add to Home Screen"

**Android Chrome:**
1. Open the chat URL
2. Tap the install banner or Menu > "Install app"

## Troubleshooting

**Messages not appearing in real-time?**
- Check Supabase Realtime is enabled for the tables
- Verify your Supabase URL and keys are correct

**Can't log in?**
- Ensure email confirmation is disabled in Supabase Auth settings
- Or check your email for confirmation link

**Push notifications not working?**
- Ensure you've granted notification permission
- Check browser supports Push API
- HTTPS is required (works on localhost for development)

## License

Private - BC Golf Safaris Team Use Only
