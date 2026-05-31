-- Conversations Table
CREATE TABLE public.conversations (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    participant1_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    participant2_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(participant1_id, participant2_id)
);

-- Direct Messages Table
CREATE TABLE public.direct_messages (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    content text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Realtime changes
-- (Note: your publication is already set to FOR ALL TABLES, so these are not needed)
-- alter publication supabase_realtime add table public.conversations;
-- alter publication supabase_realtime add table public.direct_messages;

-- RLS for conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations"
    ON public.conversations FOR SELECT
    USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);

CREATE POLICY "Users can insert conversations they are part of"
    ON public.conversations FOR INSERT
    WITH CHECK (auth.uid() = participant1_id OR auth.uid() = participant2_id);

CREATE POLICY "Users can update their own conversations"
    ON public.conversations FOR UPDATE
    USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);

-- RLS for messages
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their conversations"
    ON public.direct_messages FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.conversations c 
        WHERE c.id = conversation_id AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
    ));

CREATE POLICY "Users can insert messages in their conversations"
    ON public.direct_messages FOR INSERT
    WITH CHECK (auth.uid() = sender_id AND EXISTS (
        SELECT 1 FROM public.conversations c 
        WHERE c.id = conversation_id AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
    ));

CREATE POLICY "Users can update messages in their conversations"
    ON public.direct_messages FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.conversations c 
        WHERE c.id = conversation_id AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
    ));
