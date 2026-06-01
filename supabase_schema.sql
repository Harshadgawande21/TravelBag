-- ====================================================================
-- ULTIMATE COMPATIBLE SUPABASE DATABASE SCHEMA FOR TRAVELBAG
-- INSTRUCTIONS: Copy and run this ENTIRE block in your Supabase SQL Editor.
-- This drops conflicting tables first and creates everything with matching types.
-- ====================================================================

-- Turn off any existing tables to avoid type conflicts
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.private_chats CASCADE;
DROP TABLE IF EXISTS public.group_details CASCADE;
DROP TABLE IF EXISTS public.trips CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 1. Create Users Table (All IDs set to TEXT for perfect sync compatibility)
CREATE TABLE public.users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT DEFAULT 'goa123',
    name TEXT NOT NULL,
    avatar TEXT,
    bio TEXT,
    verified BOOLEAN DEFAULT FALSE,
    "trustScore" INT DEFAULT 60,
    "verificationStatus" TEXT DEFAULT 'none', 
    "verificationDocUrl" TEXT,
    "verificationDocsPreview" TEXT,
    role TEXT DEFAULT 'user', 
    "travelStylePreferences" JSONB DEFAULT '[]'::jsonb,
    reviews JSONB DEFAULT '[]'::jsonb,
    "blockList" JSONB DEFAULT '[]'::jsonb,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Create Trips Table (All references use TEXT keys)
CREATE TABLE public.trips (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    source TEXT NOT NULL,
    destination TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    budget NUMERIC NOT NULL,
    "travelStyle" TEXT NOT NULL,
    itinerary JSONB DEFAULT '[]'::jsonb,
    "maxCompanions" INT DEFAULT 4,
    "joinedCompanionIds" JSONB DEFAULT '[]'::jsonb,
    "pendingCompanionIds" JSONB DEFAULT '[]'::jsonb,
    "createdById" TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    "createdBy" JSONB NOT NULL, 
    completed BOOLEAN DEFAULT FALSE,
    likes JSONB DEFAULT '[]'::jsonb, 
    comments JSONB DEFAULT '[]'::jsonb, 
    "savedBy" JSONB DEFAULT '[]'::jsonb, 
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Create Group Discussions Table (Matches varchar/text types)
CREATE TABLE public.group_details (
    "tripId" TEXT PRIMARY KEY REFERENCES public.trips(id) ON DELETE CASCADE,
    messages JSONB DEFAULT '[]'::jsonb, 
    polls JSONB DEFAULT '[]'::jsonb, 
    expenses JSONB DEFAULT '[]'::jsonb,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Create Direct Private Messages Table
CREATE TABLE public.private_chats (
    id TEXT PRIMARY KEY,
    "userA" JSONB NOT NULL, 
    "userB" JSONB NOT NULL, 
    messages JSONB DEFAULT '[]'::jsonb, 
    "lastMessageAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Create Notifications Table
CREATE TABLE public.notifications (
    id TEXT PRIMARY KEY,
    "userId" TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL, 
    data JSONB DEFAULT '{}'::jsonb,
    read BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. Create Moderation Reports Table
CREATE TABLE public.reports (
    id TEXT PRIMARY KEY,
    "reporterId" TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    "reporterName" TEXT NOT NULL,
    "itemType" TEXT NOT NULL, 
    "itemId" TEXT NOT NULL,
    "itemPreview" TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending', 
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ====================================================================
-- SEED INITIAL SYSTEM & ADMIN ACCOUNTS
-- ====================================================================

INSERT INTO public.users (
  id, 
  email, 
  password,
  name, 
  avatar, 
  bio, 
  verified, 
  "trustScore", 
  "verificationStatus", 
  "verificationDocUrl",
  "verificationDocsPreview",
  role, 
  "travelStylePreferences", 
  reviews,
  "blockList"
)
VALUES 
(
  'user-hasrhad-2110', 
  'hasrhad2110@travel.com', 
  'Fantasticfive@4023',
  'hasrhad@2110', 
  'https://api.dicebear.com/7.x/adventurer/svg?seed=hasrhad', 
  'Super Admin at TravelBag. Managing companion interactions and platform safety.', 
  TRUE, 
  100, 
  'approved', 
  NULL,
  NULL,
  'admin', 
  '["Adventure", "Solo", "Foodie"]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb
),
(
  'user-harshad-2110', 
  'harshad2110@travel.com', 
  'Fantasticfive@4023',
  'harshad@2110', 
  'https://api.dicebear.com/7.x/adventurer/svg?seed=harshad', 
  'Super Admin at TravelBag. Managing companion interactions and platform safety.', 
  TRUE, 
  100, 
  'approved', 
  NULL,
  NULL,
  'admin', 
  '["Adventure", "Solo", "Foodie"]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb
),
(
  'user-harshad-4023', 
  'harshad4023@travel.com', 
  'Fantasticfive@4023',
  'harshad4023', 
  'https://api.dicebear.com/7.x/adventurer/svg?seed=harshad4023', 
  'Platform Administrator. Orchestrating itineraries & ensuring user safety.', 
  TRUE, 
  100, 
  'approved', 
  NULL,
  NULL,
  'admin', 
  '["Luxury", "Foodie", "Local Culture"]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb
),
(
  'user-admin', 
  'admin@travel.com', 
  'admin123',
  'admin', 
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Admin', 
  'Chief travel moderator and safety overseer on TravelBag.', 
  TRUE, 
  100, 
  'approved', 
  NULL,
  NULL,
  'admin', 
  '["Adventure", "Backpacker"]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- 8. Enable Public Access policies for background sync matching the client/server app
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select on public users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow insert on public users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on public users" ON public.users FOR UPDATE USING (true);

CREATE POLICY "Allow select on public trips" ON public.trips FOR SELECT USING (true);
CREATE POLICY "Allow insert on public trips" ON public.trips FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on public trips" ON public.trips FOR UPDATE USING (true);
CREATE POLICY "Allow delete on public trips" ON public.trips FOR DELETE USING (true);

CREATE POLICY "Allow select on group_details" ON public.group_details FOR SELECT USING (true);
CREATE POLICY "Allow insert on group_details" ON public.group_details FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on group_details" ON public.group_details FOR UPDATE USING (true);

CREATE POLICY "Allow select on private_chats" ON public.private_chats FOR SELECT USING (true);
CREATE POLICY "Allow insert on private_chats" ON public.private_chats FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on private_chats" ON public.private_chats FOR UPDATE USING (true);

CREATE POLICY "Allow select on notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Allow insert on notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on notifications" ON public.notifications FOR UPDATE USING (true);

CREATE POLICY "Allow select on reports" ON public.reports FOR SELECT USING (true);
CREATE POLICY "Allow insert on reports" ON public.reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on reports" ON public.reports FOR UPDATE USING (true);

-- Force PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';

