# BC Golf Safaris Team Chat - Setup Guide

## 🚀 Deployed URLs

- **GitHub Repo:** https://github.com/lencurrie/bc-golf-chat
- **Vercel App:** https://bc-golf-chat.vercel.app

## ⚠️ IMPORTANT: Complete Setup Required

The app is deployed but needs Supabase configuration to work. Follow these steps:

---

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up (free)
2. Click "New Project"
3. Choose organization (create one if needed)
4. Enter project details:
   - **Name:** bc-golf-chat
   - **Database Password:** (save this somewhere secure!)
   - **Region:** Pick closest to your users
5. Click "Create new project" (takes ~2 minutes)

---

## Step 2: Run Database Schema

1. In Supabase, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Copy the entire contents of `supabase-schema.sql` from this repo
4. Click **Run** (green play button)
5. You should see "Success. No rows returned"

---

## Step 3: Enable Realtime

1. Go to **Database > Replication** in Supabase
2. Find "supabase_realtime" publication
3. Click the toggle to enable for:
   - ✅ messages
   - ✅ direct_messages
   - ✅ channels
   - ✅ channel_members

---

## Step 4: Configure Authentication

1. Go to **Authentication > Providers**
2. Ensure **Email** provider is enabled
3. For testing, disable email confirmation:
   - Go to **Authentication > Settings**
   - Turn OFF "Enable email confirmations"
   - Click **Save**

---

## Step 5: Get API Keys

1. Go to **Settings > API** in Supabase
2. Copy these values:
   - **Project URL** → Will be your `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → Will be your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → Will be your `SUPABASE_SERVICE_ROLE_KEY`

---

## Step 6: Add Environment Variables to Vercel

1. Go to [vercel.com/lencurries-projects/bc-golf-chat/settings/environment-variables](https://vercel.com/lencurries-projects/bc-golf-chat/settings/environment-variables)
2. Add these environment variables:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |

3. Click **Save** for each
4. Go to **Deployments** tab
5. Click the `...` menu on the latest deployment
6. Click **Redeploy** → **Redeploy**

---

## Step 7: Create Admin User

1. Go to https://bc-golf-chat.vercel.app/signup
2. Create an account with your email
3. Go back to Supabase **SQL Editor**
4. Run this query (replace email):

```sql
UPDATE profiles 
SET is_admin = true 
WHERE email = 'your-email@example.com';
```

5. Add yourself to the General channel:

```sql
INSERT INTO channel_members (channel_id, user_id)
SELECT '00000000-0000-0000-0000-000000000001', id 
FROM profiles 
WHERE email = 'your-email@example.com';
```

---

## Step 8: Test the App

1. Go to https://bc-golf-chat.vercel.app
2. Log in with your admin account
3. You should see the chat interface
4. Open the menu (hamburger icon) to see channels and admin link

---

## Adding New Users

### Option A: Self-signup
Have users go to https://bc-golf-chat.vercel.app/signup

Then add them to channels via SQL:
```sql
INSERT INTO channel_members (channel_id, user_id)
SELECT '00000000-0000-0000-0000-000000000001', id 
FROM profiles 
WHERE email = 'new-user@example.com';
```

### Option B: Admin Panel
1. Log in as admin
2. Open menu → Admin Panel
3. Use the Channels tab to add users to channels

---

## Mobile Installation (PWA)

### iPhone/iPad:
1. Open the chat URL in Safari
2. Tap the Share button (box with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"

### Android:
1. Open the chat URL in Chrome
2. Tap the menu (three dots)
3. Tap "Add to Home screen" or "Install app"

---

## Features

✅ Real-time messaging
✅ Channel conversations
✅ Direct messages (1:1)
✅ Admin panel (user management, channel management)
✅ Mobile-optimized (PWA)
✅ Push notification support
✅ Dark theme

---

## Troubleshooting

**"Invalid API key" error:**
- Check environment variables in Vercel are correct
- Redeploy after adding/changing env vars

**Can't log in:**
- Make sure email confirmation is disabled in Supabase Auth settings
- Check browser console for errors

**Messages not appearing:**
- Verify Realtime is enabled for tables in Supabase
- Check you're a member of the channel

**Push notifications not working:**
- Notifications require HTTPS (works on Vercel)
- User must grant permission when prompted
- Check browser supports Push API

---

## Support

For issues, check the GitHub repo: https://github.com/lencurrie/bc-golf-chat
