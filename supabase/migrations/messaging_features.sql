-- ============================================================
-- Messaging Features Update
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 0. Create updated_at helper function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Update messages table
-- Using IF NOT EXISTS logic via a DO block to prevent errors if already renamed
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'is_read') THEN
    ALTER TABLE public.messages RENAME COLUMN is_read TO is_seen;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'type') THEN
    ALTER TABLE public.messages ADD COLUMN type text DEFAULT 'text' CHECK (type IN ('text', 'offer'));
  END IF;
END $$;

-- 2. Create offer_details table
CREATE TABLE IF NOT EXISTS public.offer_details (
  message_id uuid PRIMARY KEY REFERENCES public.messages(id) ON DELETE CASCADE,
  amount numeric(10, 2) NOT NULL,
  currency text DEFAULT 'USD' NOT NULL,
  description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 3. RLS for offer_details
ALTER TABLE public.offer_details ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view offer details in their conversations" ON public.offer_details;
CREATE POLICY "Users can view offer details in their conversations" ON public.offer_details FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversations c ON c.id = m.conversation_id
      WHERE m.id = message_id
      AND (c.user_id = auth.uid() OR c.professional_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create offer details" ON public.offer_details;
CREATE POLICY "Users can create offer details" ON public.offer_details FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversations c ON c.id = m.conversation_id
      WHERE m.id = message_id
      AND m.sender_id = auth.uid()
      AND (c.user_id = auth.uid() OR c.professional_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update offer details" ON public.offer_details;
CREATE POLICY "Users can update offer details" ON public.offer_details FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversations c ON c.id = m.conversation_id
      WHERE m.id = message_id
      AND (c.user_id = auth.uid() OR c.professional_id = auth.uid())
    )
  );

-- 4. Enable Realtime for offer_details
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'offer_details'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.offer_details;
  END IF;
END $$;

-- 5. Add updated_at trigger for offer_details
DROP TRIGGER IF EXISTS handle_offer_details_updated_at ON public.offer_details;
CREATE TRIGGER handle_offer_details_updated_at 
  BEFORE UPDATE ON public.offer_details 
  FOR EACH ROW 
  EXECUTE FUNCTION handle_updated_at();
