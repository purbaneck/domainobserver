/*
  Fix Foreign Key References
  
  This migration creates triggers to automatically create profile records
  when users are created through auth. This ensures foreign key constraints
  are always satisfied when adding domains.
*/

-- Create a trigger function to create profiles for new users
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, notifications_enabled)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data->>'full_name', 
    TRUE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure the trigger doesn't already exist before creating it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create a trigger on user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
