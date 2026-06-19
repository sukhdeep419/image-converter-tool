# Supabase Setup Guide

## Get Your Credentials:

1. Go to [supabase.com](https://supabase.com) and create a project
2. In your project dashboard, go to **Settings -> API**
3. Copy the values:
   - **Project URL** -> `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon Key** (public) -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Create Database Tables:

Go to your Supabase dashboard -> **SQL Editor** and run this:

```sql
-- Contact Submissions Table
CREATE TABLE contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert anonymous submissions.
-- Authenticated submissions must belong to the signed-in user.
CREATE POLICY "Enable insert for all"
  ON contact_submissions FOR INSERT
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

-- Policy: Users can view their own submissions
CREATE POLICY "Enable read for authenticated users"
  ON contact_submissions FOR SELECT
  USING (auth.uid() = user_id);
```

## Enable Authentication:

1. Go to **Authentication -> Providers**
2. Enable "Email" provider
3. Go to **Authentication -> Email Templates** (optional, customize if needed)

## Optional Email Notifications:

Contact submissions are saved to Supabase through `src/app/api/contact/route.ts`.
If you also want email notifications, add these server-only variables:

```bash
SMTP_USER=your-address@gmail.com
SMTP_PASS=your-gmail-app-password
CONTACT_TO=where-messages-should-go@example.com
```

## After Setup:

Run your dev server:
```bash
npm run dev
```

The files created:
- `src/lib/supabase.ts` - Supabase client
- `src/lib/auth.ts` - Authentication functions
- `src/lib/contact.ts` - Contact form functions
