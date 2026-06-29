ALTER TABLE public.live_stream_reactions
  ADD COLUMN IF NOT EXISTS event_id text NOT NULL DEFAULT '300-awakening';

ALTER TABLE public.live_stream_reactions
  DROP CONSTRAINT IF EXISTS live_stream_reactions_reaction_type_check;

ALTER TABLE public.live_stream_reactions
  ADD CONSTRAINT live_stream_reactions_reaction_type_check
  CHECK (
    reaction_type IN (
      'fire',
      'praise',
      'heart',
      'pray',
      'seed',
      'applause',
      'laugh',
      'surprise'
    )
  );

CREATE INDEX IF NOT EXISTS live_stream_reactions_event_created_at_idx
  ON public.live_stream_reactions (event_id, created_at DESC);

COMMENT ON COLUMN public.live_stream_reactions.event_id IS
  'Event partition key for attendee reaction telemetry.';
