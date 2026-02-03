-- Fix handle_new_user trigger to use role from metadata instead of hardcoded 'student'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    user_role TEXT;
    user_full_name TEXT;
BEGIN
    -- Try to get role from user metadata, default to 'student' if not provided
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
    
    -- Ensure role is valid
    IF user_role NOT IN ('admin', 'student', 'teacher') THEN
        user_role := 'student';
    END IF;
    
    -- Get full name from metadata
    user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
    
    -- Insert into profiles (only if doesn't exist)
    INSERT INTO public.profiles (user_id, full_name, email, role, active)
    VALUES (NEW.id, user_full_name, NEW.email, user_role, true)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Insert into user_roles (only if doesn't exist)
    INSERT INTO public.user_roles (user_id, role, full_name, email)
    VALUES (NEW.id, user_role, user_full_name, NEW.email)
    ON CONFLICT (user_id) DO UPDATE
    SET role = EXCLUDED.role,
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail user creation
        RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
        RETURN NEW;
END;
$$;
