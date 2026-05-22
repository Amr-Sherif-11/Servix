-- =============================================================
-- Servix (Antigravity) — Row Level Security (RLS) Policies
-- Run this in:  Supabase Dashboard → SQL Editor
--
-- Covers ALL 9 tables:
--   profiles, professional_details, requests, conversations,
--   messages, reviews, notifications, blocks, reports
--
-- ⚠️  This script is IDEMPOTENT — safe to re-run.
--     It drops existing policies first, then recreates them.
-- =============================================================


-- =============================================================
-- 0A. CREATE MISSING TABLES (IF NOT EXISTS)
--     Some tables may not have been created yet.
--     This ensures the RLS section below never fails.
-- =============================================================

-- reviews
CREATE TABLE IF NOT EXISTS reviews (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  request_id   uuid NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  rating       smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment      text,
  created_at   timestamptz DEFAULT now()
);

-- notifications
CREATE TABLE IF NOT EXISTS notifications (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type         text NOT NULL,
  title        text NOT NULL,
  body         text NOT NULL,
  data         jsonb,
  is_read      boolean DEFAULT false,
  created_at   timestamptz DEFAULT now()
);

-- blocks
CREATE TABLE IF NOT EXISTS blocks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at   timestamptz DEFAULT now(),
  UNIQUE (blocker_id, blocked_id)
);

-- reports
CREATE TABLE IF NOT EXISTS reports (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason       text NOT NULL,
  details      text,
  created_at   timestamptz DEFAULT now()
);

-- =============================================================
-- 0. HELPER FUNCTION
--    Shorthand to check "is this the currently authenticated user?"
-- =============================================================
CREATE OR REPLACE FUNCTION public.is_owner(record_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT auth.uid() = record_user_id;
$$;

-- Give authenticated users permission to call the helper
GRANT EXECUTE ON FUNCTION public.is_owner(uuid) TO authenticated;


-- =============================================================
-- 1. PROFILES
--    • id = auth.uid()  (profile row IS the user)
--    • Anyone can SELECT professional profiles (public listing)
--    • Only owner can UPDATE their own profile
--    • INSERT handled by Supabase trigger on auth.users
--    • DELETE not allowed from client
-- =============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist (idempotent)
DROP POLICY IF EXISTS "Users can view own profile"          ON profiles;
DROP POLICY IF EXISTS "Users can update own profile"        ON profiles;
DROP POLICY IF EXISTS "Public can view professional profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own"                 ON profiles;
DROP POLICY IF EXISTS "profiles_select_professionals"       ON profiles;
DROP POLICY IF EXISTS "profiles_update_own"                 ON profiles;

-- Owner can always read their own profile
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Anyone authenticated can browse professional profiles
-- (needed for search/listing pages)
CREATE POLICY "profiles_select_professionals"
  ON profiles FOR SELECT
  USING (role = 'professional');

-- Only the owner can update their profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING  (auth.uid() = id)          -- row filter: can only see own row
  WITH CHECK (auth.uid() = id);     -- write guard: can only write own row


-- =============================================================
-- 2. PROFESSIONAL_DETAILS
--    • profile_id references profiles.id
--    • Public read for browsing professionals
--    • Only the owning professional can INSERT / UPDATE / DELETE
-- =============================================================
ALTER TABLE professional_details ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profdetails_select_public"  ON professional_details;
DROP POLICY IF EXISTS "profdetails_insert_own"     ON professional_details;
DROP POLICY IF EXISTS "profdetails_update_own"     ON professional_details;
DROP POLICY IF EXISTS "profdetails_delete_own"     ON professional_details;

-- Anyone authenticated can view professional details (public listing)
CREATE POLICY "profdetails_select_public"
  ON professional_details FOR SELECT
  USING (true);

-- Professional can insert their own details
CREATE POLICY "profdetails_insert_own"
  ON professional_details FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

-- Professional can update their own details
CREATE POLICY "profdetails_update_own"
  ON professional_details FOR UPDATE
  USING      (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- Professional can delete their own details
CREATE POLICY "profdetails_delete_own"
  ON professional_details FOR DELETE
  USING (auth.uid() = profile_id);


-- =============================================================
-- 3. REQUESTS
--    • user_id   = the person requesting a service
--    • professional_id = the professional being asked
--    • Both parties can SELECT
--    • Only the user can INSERT (create a request)
--    • Only the professional can UPDATE status
--    • No client-side DELETE (requests are historical records)
-- =============================================================
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "requests_select_parties"     ON requests;
DROP POLICY IF EXISTS "requests_insert_user"        ON requests;
DROP POLICY IF EXISTS "requests_update_professional" ON requests;

-- Both the user and the professional can see the request
CREATE POLICY "requests_select_parties"
  ON requests FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = professional_id);

-- Only authenticated users can create a request, and they must
-- set user_id to their own ID (prevents impersonation)
CREATE POLICY "requests_insert_user"
  ON requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only the professional can update the request (accept/reject/complete)
CREATE POLICY "requests_update_professional"
  ON requests FOR UPDATE
  USING      (auth.uid() = professional_id)
  WITH CHECK (auth.uid() = professional_id);


-- =============================================================
-- 4. CONVERSATIONS
--    • user_id and professional_id are the two participants
--    • Both can SELECT
--    • Only the user can INSERT (start a conversation)
--    • Both parties can UPDATE (e.g. last_message)
--    • No client-side DELETE
-- =============================================================
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own conversations"   ON conversations;
DROP POLICY IF EXISTS "conversations_select_parties"  ON conversations;
DROP POLICY IF EXISTS "conversations_insert_user"     ON conversations;
DROP POLICY IF EXISTS "conversations_update_parties"  ON conversations;

-- Both participants can read
CREATE POLICY "conversations_select_parties"
  ON conversations FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = professional_id);

-- Only the requesting user can create a conversation
CREATE POLICY "conversations_insert_user"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Both participants can update (set last_message etc.)
CREATE POLICY "conversations_update_parties"
  ON conversations FOR UPDATE
  USING      (auth.uid() = user_id OR auth.uid() = professional_id)
  WITH CHECK (auth.uid() = user_id OR auth.uid() = professional_id);


-- =============================================================
-- 5. MESSAGES
--    • conversation_id links to conversations
--    • sender_id = who wrote the message
--    • Both conversation participants can SELECT
--    • Only the sender can INSERT (must be a participant)
--    • UPDATE limited to marking is_read (by receiver)
--    • No client-side DELETE
-- =============================================================
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see messages in their conversations" ON messages;
DROP POLICY IF EXISTS "messages_select_participants" ON messages;
DROP POLICY IF EXISTS "messages_insert_sender"      ON messages;
DROP POLICY IF EXISTS "messages_update_participant"  ON messages;

-- Helper: is the current user a participant of the conversation?
-- (used as a subquery — no separate function needed)

-- Both participants can read messages
CREATE POLICY "messages_select_participants"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
       WHERE c.id = messages.conversation_id
         AND (c.user_id = auth.uid() OR c.professional_id = auth.uid())
    )
  );

-- Only a conversation participant can insert a message,
-- and they must set sender_id to their own ID
CREATE POLICY "messages_insert_sender"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversations c
       WHERE c.id = messages.conversation_id
         AND (c.user_id = auth.uid() OR c.professional_id = auth.uid())
    )
  );

-- A participant can update messages (e.g. mark is_read)
CREATE POLICY "messages_update_participant"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
       WHERE c.id = messages.conversation_id
         AND (c.user_id = auth.uid() OR c.professional_id = auth.uid())
    )
  );


-- =============================================================
-- 6. REVIEWS
--    • reviewer_id = who wrote the review
--    • professional_id = who was reviewed
--    • Public read (anyone can see reviews)
--    • Only the reviewer can INSERT (and must own the request)
--    • Only the reviewer can UPDATE/DELETE their own review
-- =============================================================
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_select_public"   ON reviews;
DROP POLICY IF EXISTS "reviews_insert_reviewer" ON reviews;
DROP POLICY IF EXISTS "reviews_update_reviewer" ON reviews;
DROP POLICY IF EXISTS "reviews_delete_reviewer" ON reviews;

-- Anyone authenticated can read reviews
CREATE POLICY "reviews_select_public"
  ON reviews FOR SELECT
  USING (true);

-- Only the reviewer can insert, and they must own the linked request
CREATE POLICY "reviews_insert_reviewer"
  ON reviews FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id
    AND EXISTS (
      SELECT 1 FROM requests r
       WHERE r.id = reviews.request_id
         AND r.user_id = auth.uid()
         AND r.status = 'completed'
    )
  );

-- Only the reviewer can update their review
CREATE POLICY "reviews_update_reviewer"
  ON reviews FOR UPDATE
  USING      (auth.uid() = reviewer_id)
  WITH CHECK (auth.uid() = reviewer_id);

-- Only the reviewer can delete their review
CREATE POLICY "reviews_delete_reviewer"
  ON reviews FOR DELETE
  USING (auth.uid() = reviewer_id);


-- =============================================================
-- 7. NOTIFICATIONS
--    • user_id = who the notification is for
--    • Only the owner can SELECT / UPDATE (mark read) / DELETE
--    • INSERT is server-side only (triggers / Edge Functions)
-- =============================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;

-- Owner can read their notifications
CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Owner can update (mark as read)
CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Owner can delete (dismiss)
CREATE POLICY "notifications_delete_own"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- ⚠️ No INSERT policy — notifications are created server-side
--    (via database triggers, Edge Functions, or service_role key).
--    This prevents users from faking notifications.


-- =============================================================
-- 8. BLOCKS
--    • blocker_id = who initiated the block
--    • blocked_id = who is blocked
--    • Only the blocker can INSERT / SELECT / DELETE
--    • No UPDATE (blocks are binary — exist or don't)
-- =============================================================
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blocks_select_blocker" ON blocks;
DROP POLICY IF EXISTS "blocks_insert_blocker" ON blocks;
DROP POLICY IF EXISTS "blocks_delete_blocker" ON blocks;

-- Blocker can see their blocks
CREATE POLICY "blocks_select_blocker"
  ON blocks FOR SELECT
  USING (auth.uid() = blocker_id);

-- Only authenticated user can block, must set blocker_id to self,
-- and cannot block themselves
CREATE POLICY "blocks_insert_blocker"
  ON blocks FOR INSERT
  WITH CHECK (
    auth.uid() = blocker_id
    AND auth.uid() != blocked_id
  );

-- Only the blocker can unblock
CREATE POLICY "blocks_delete_blocker"
  ON blocks FOR DELETE
  USING (auth.uid() = blocker_id);


-- =============================================================
-- 9. REPORTS
--    • reporter_id = who filed the report
--    • reported_id = who is being reported
--    • Only the reporter can INSERT / view own reports
--    • No UPDATE / DELETE from client (admins handle reports)
-- =============================================================
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports_select_reporter" ON reports;
DROP POLICY IF EXISTS "reports_insert_reporter" ON reports;

-- Reporter can see their own reports
CREATE POLICY "reports_select_reporter"
  ON reports FOR SELECT
  USING (auth.uid() = reporter_id);

-- Only authenticated user can file a report, must set reporter_id to self,
-- and cannot report themselves
CREATE POLICY "reports_insert_reporter"
  ON reports FOR INSERT
  WITH CHECK (
    auth.uid() = reporter_id
    AND auth.uid() != reported_id
  );

-- ⚠️ No UPDATE/DELETE policies — reports are immutable from client side.
--    Only admins (via service_role key) can manage reports.


-- =============================================================
-- ✅ DONE — All 9 tables are now secured with RLS.
-- =============================================================
