-- Galaxy of Thoughts - Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Create stars table
CREATE TABLE IF NOT EXISTS stars (
  id BIGSERIAL PRIMARY KEY,
  fingerprint_id VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  position_x FLOAT NOT NULL,
  position_y FLOAT NOT NULL,
  position_z FLOAT NOT NULL,
  color VARCHAR(7) NOT NULL DEFAULT '#ffffff',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT message_length CHECK (char_length(message) >= 10 AND char_length(message) <= 280)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fingerprint ON stars(fingerprint_id);
CREATE INDEX IF NOT EXISTS idx_created_at ON stars(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE stars ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read all stars
CREATE POLICY "Stars are viewable by everyone"
  ON stars FOR SELECT
  USING (true);

-- Policy: Anyone can insert a star (rate limiting handled in API)
CREATE POLICY "Anyone can insert a star"
  ON stars FOR INSERT
  WITH CHECK (true);

-- Create a function to get all stars with their data
CREATE OR REPLACE FUNCTION get_all_stars()
RETURNS TABLE (
  id BIGINT,
  message TEXT,
  position_x FLOAT,
  position_y FLOAT,
  position_z FLOAT,
  color VARCHAR(7),
  created_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    stars.id,
    stars.message,
    stars.position_x,
    stars.position_y,
    stars.position_z,
    stars.color,
    stars.created_at
  FROM stars
  ORDER BY stars.created_at DESC;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_all_stars() TO anon, authenticated;
