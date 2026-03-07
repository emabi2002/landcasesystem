-- Users table for system administration
-- This table stores user profiles and permissions

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'viewer',
  department TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_sign_in_at TIMESTAMPTZ,

  CONSTRAINT users_role_check CHECK (role IN ('admin', 'case_manager', 'legal_officer', 'document_clerk', 'viewer')),
  CONSTRAINT users_status_check CHECK (status IN ('active', 'inactive'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
-- Policy 1: Admins can view all users
CREATE POLICY "Admins can view all users"
  ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.status = 'active'
    )
  );

-- Policy 2: Admins can insert new users
CREATE POLICY "Admins can insert users"
  ON users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.status = 'active'
    )
  );

-- Policy 3: Admins can update users
CREATE POLICY "Admins can update users"
  ON users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.status = 'active'
    )
  );

-- Policy 4: Admins can delete users
CREATE POLICY "Admins can delete users"
  ON users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
      AND users.status = 'active'
    )
  );

-- Policy 5: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Policy 6: Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM users WHERE id = auth.uid())
    AND status = (SELECT status FROM users WHERE id = auth.uid())
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();

-- Function to sync last_sign_in_at from auth.users
CREATE OR REPLACE FUNCTION sync_user_last_sign_in()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET last_sign_in_at = NEW.last_sign_in_at
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync last sign in time from auth.users
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
  EXECUTE FUNCTION sync_user_last_sign_in();

-- Insert default admin user (update with your actual admin email)
-- This will be created when the first user signs up
-- You can manually insert this after creating your first auth user:
-- INSERT INTO users (id, email, full_name, role, department, status)
-- VALUES (
--   '<your-auth-user-id>',
--   'admin@dlpp.gov.pg',
--   'System Administrator',
--   'admin',
--   'IT Department',
--   'active'
-- );

-- Comments for documentation
COMMENT ON TABLE users IS 'User profiles and permissions for the DLPP Legal CMS';
COMMENT ON COLUMN users.id IS 'References auth.users(id)';
COMMENT ON COLUMN users.role IS 'User role: admin, case_manager, legal_officer, document_clerk, or viewer';
COMMENT ON COLUMN users.status IS 'Account status: active or inactive';
COMMENT ON COLUMN users.department IS 'Department or division within DLPP';
COMMENT ON COLUMN users.last_sign_in_at IS 'Last successful sign in timestamp, synced from auth.users';
