/*
  # Fix profiles table RLS policies

  1. Changes
    - Drop existing restrictive RLS policies for profiles table
    - Create new policies that properly handle profile access
    - Allow users to insert their own profile
    - Allow users to view their own profile
    - Allow users to update their own profile

  2. Security
    - Maintains RLS protection
    - Ensures users can only access their own profile data
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create new policies
CREATE POLICY "Enable read access for users" ON profiles
  FOR SELECT USING (
    auth.uid() = id
  );

CREATE POLICY "Enable insert access for users" ON profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id
  );

CREATE POLICY "Enable update access for users" ON profiles
  FOR UPDATE USING (
    auth.uid() = id
  );
