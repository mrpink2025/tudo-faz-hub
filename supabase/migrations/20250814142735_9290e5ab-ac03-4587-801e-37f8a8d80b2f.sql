-- Enable realtime for messages table
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Add the messages table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Create a function to get conversation participants
CREATE OR REPLACE FUNCTION get_conversation_participants(sender uuid, recipient uuid)
RETURNS TABLE(user_id uuid, email text, full_name text) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.email, p.full_name
  FROM profiles p
  WHERE p.id IN (sender, recipient);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get last message timestamp for each conversation
CREATE OR REPLACE FUNCTION get_conversations_with_last_message(user_uuid uuid)
RETURNS TABLE(
  other_user_id uuid,
  other_user_email text,
  other_user_name text,
  last_message text,
  last_message_time timestamp with time zone,
  unread_count bigint
) AS $$
BEGIN
  RETURN QUERY
  WITH conversations AS (
    SELECT 
      CASE 
        WHEN m.sender_id = user_uuid THEN m.recipient_id
        ELSE m.sender_id
      END as other_user,
      MAX(m.created_at) as last_time
    FROM messages m
    WHERE m.sender_id = user_uuid OR m.recipient_id = user_uuid
    GROUP BY 
      CASE 
        WHEN m.sender_id = user_uuid THEN m.recipient_id
        ELSE m.sender_id
      END
  ),
  last_messages AS (
    SELECT DISTINCT ON (c.other_user)
      c.other_user,
      c.last_time,
      m.content as last_content
    FROM conversations c
    JOIN messages m ON (
      (m.sender_id = user_uuid AND m.recipient_id = c.other_user) OR
      (m.sender_id = c.other_user AND m.recipient_id = user_uuid)
    ) AND m.created_at = c.last_time
    ORDER BY c.other_user, m.created_at DESC
  ),
  unread_counts AS (
    SELECT 
      m.sender_id as other_user,
      COUNT(*) as unread
    FROM messages m
    WHERE m.recipient_id = user_uuid
      AND m.created_at > COALESCE(
        (SELECT last_read_at FROM user_message_reads WHERE user_id = user_uuid AND conversation_user_id = m.sender_id),
        '1970-01-01'::timestamp
      )
    GROUP BY m.sender_id
  )
  SELECT 
    lm.other_user,
    p.email,
    p.full_name,
    lm.last_content,
    lm.last_time,
    COALESCE(uc.unread, 0)
  FROM last_messages lm
  JOIN profiles p ON p.id = lm.other_user
  LEFT JOIN unread_counts uc ON uc.other_user = lm.other_user
  ORDER BY lm.last_time DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create table to track read status
CREATE TABLE IF NOT EXISTS public.user_message_reads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  conversation_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  last_read_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id, conversation_user_id)
);

-- Enable RLS for user_message_reads
ALTER TABLE public.user_message_reads ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_message_reads
CREATE POLICY "Users can manage their own read status" 
ON public.user_message_reads 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(conversation_user uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO user_message_reads (user_id, conversation_user_id, last_read_at)
  VALUES (auth.uid(), conversation_user, now())
  ON CONFLICT (user_id, conversation_user_id)
  DO UPDATE SET 
    last_read_at = now(),
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;