# BC Golf Chat - Setup Guide

## Deploying to Vercel

### Step 1: Push to GitHub

The code should already be in the repository. If not:

```bash
cd ~/.openclaw/workspace/bc-golf-chat
git add .
git commit -m "Convert from Supabase to Vercel Postgres"
git push origin main
```

### Step 2: Connect Vercel Postgres

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select the **bc-golf-chat** project
3. Click **Storage** tab
4. Click **Create Database** → **Postgres**
5. Name it (e.g., "bc-golf-chat-db")
6. Select your region (closest to your users)
7. Click **Create**

The database will automatically be connected to your project with the required environment variables.

### Step 3: Add NextAuth Secret

1. In Vercel Dashboard, go to **Settings** → **Environment Variables**
2. Add:
   - `NEXTAUTH_SECRET` = (generate with `openssl rand -base64 32`)
   - `NEXTAUTH_URL` = `https://bc-golf-chat.vercel.app`

### Step 4: Deploy

1. Vercel will automatically redeploy when you push changes
2. Or manually trigger: **Deployments** → **Redeploy**

### Step 5: Initialize Database

After deployment, the database schema needs to be pushed:

**Option A: Via Vercel CLI (recommended)**
```bash
vercel env pull .env.local
npx prisma db push
```

**Option B: Via Vercel Dashboard**
1. Go to **Deployments** → latest deployment
2. Click **Functions** log to see if Prisma ran
3. If tables don't exist, you may need to run prisma db push locally

### Step 6: Create Admin User

1. Visit https://bc-golf-chat.vercel.app/signup
2. Create your account
3. In Vercel Dashboard → Storage → Your Database → Data Browser
4. Find the `profiles` table
5. Edit your user row and set `is_admin` to `true`

Or use Prisma Studio locally:
```bash
vercel env pull .env.local
npx prisma studio
```

### Step 7: Create Default Channel

1. Log in as admin
2. Go to Admin Panel
3. Create a "General" channel
4. All new users will be added to it automatically

## Troubleshooting

### "Cannot find module '@prisma/client'"
Run: `npx prisma generate`

### Database connection errors
- Ensure Vercel Postgres is connected in Storage
- Check environment variables are set
- For local dev: `vercel env pull .env.local`

### Auth errors
- Ensure `NEXTAUTH_SECRET` is set
- Ensure `NEXTAUTH_URL` matches your deployment URL

### Users can't see channels
- Admins need to add users to channels manually
- Or modify signup to auto-add users to "General" channel

## Environment Variables

| Variable | Description |
|----------|-------------|
| `POSTGRES_PRISMA_URL` | Prisma connection string (auto-set by Vercel) |
| `POSTGRES_URL_NON_POOLING` | Direct Postgres URL for migrations |
| `NEXTAUTH_SECRET` | Secret for signing JWT tokens |
| `NEXTAUTH_URL` | Your app's URL |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | (Optional) For push notifications |
| `VAPID_PRIVATE_KEY` | (Optional) For push notifications |
