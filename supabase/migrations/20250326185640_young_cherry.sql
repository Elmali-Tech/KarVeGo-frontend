/*
  # Add updated_at trigger functionality

  1. Changes
    - Creates handle_updated_at function
    - Adds trigger for automatic updated_at timestamp updates

  2. Details
    - Function updates the updated_at column on row updates
    - Trigger executes before each row update
*/

-- Create the updated_at trigger function
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the trigger
DROP TRIGGER IF EXISTS handle_profiles_updated_at ON profiles;
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();