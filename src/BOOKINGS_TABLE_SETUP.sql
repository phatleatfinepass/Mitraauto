-- ============================================
-- BOOKINGS TABLE SETUP FOR SUPABASE
-- ============================================
-- Run this SQL in Supabase SQL Editor to create the bookings table

-- Drop table if exists (CAREFUL - this will delete all data!)
-- DROP TABLE IF EXISTS bookings CASCADE;

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Booking details
  license_plate VARCHAR(20) NOT NULL,
  booking_date DATE NOT NULL,
  booking_time VARCHAR(5) NOT NULL, -- Format: "HH:MM" (e.g., "10:00", "14:30")
  
  -- Service information
  service_name TEXT NOT NULL,
  
  -- Customer information
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  customer_email VARCHAR(255),
  notes TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'confirmed',
  -- Possible statuses: confirmed, pending, cancelled, completed
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_date 
  ON bookings(booking_date);

CREATE INDEX IF NOT EXISTS idx_bookings_date_time 
  ON bookings(booking_date, booking_time);

CREATE INDEX IF NOT EXISTS idx_bookings_license_plate 
  ON bookings(license_plate);

CREATE INDEX IF NOT EXISTS idx_bookings_status 
  ON bookings(status);

CREATE INDEX IF NOT EXISTS idx_bookings_created_at 
  ON bookings(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bookings_updated_at 
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Policy 1: Allow all users to read bookings (for public booking page)
CREATE POLICY "Enable read access for all users" 
  ON bookings FOR SELECT 
  USING (true);

-- Policy 2: Allow all users to insert bookings (for public booking)
CREATE POLICY "Enable insert for all users" 
  ON bookings FOR INSERT 
  WITH CHECK (true);

-- Policy 3: Allow authenticated users to update bookings (for admin)
CREATE POLICY "Enable update for authenticated users" 
  ON bookings FOR UPDATE 
  USING (true)
  WITH CHECK (true);

-- Policy 4: Allow authenticated users to delete bookings (for admin)
CREATE POLICY "Enable delete for authenticated users" 
  ON bookings FOR DELETE 
  USING (true);

-- ============================================
-- BLOCKED SLOTS TABLE (if not exists)
-- ============================================

-- Create blocked_slots table
CREATE TABLE IF NOT EXISTS blocked_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Slot details
  date DATE NOT NULL,
  start_time VARCHAR(5) NOT NULL, -- Format: "HH:MM"
  end_time VARCHAR(5) NOT NULL,   -- Format: "HH:MM"
  reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for blocked_slots
CREATE INDEX IF NOT EXISTS idx_blocked_slots_date 
  ON blocked_slots(date);

CREATE INDEX IF NOT EXISTS idx_blocked_slots_date_time 
  ON blocked_slots(date, start_time, end_time);

-- Enable RLS for blocked_slots
ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;

-- Policies for blocked_slots
CREATE POLICY "Enable read access for all users on blocked_slots" 
  ON blocked_slots FOR SELECT 
  USING (true);

CREATE POLICY "Enable insert for authenticated users on blocked_slots" 
  ON blocked_slots FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users on blocked_slots" 
  ON blocked_slots FOR DELETE 
  USING (true);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('bookings', 'blocked_slots');

-- Check bookings table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'bookings'
ORDER BY ordinal_position;

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('bookings', 'blocked_slots');

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Insert sample booking
INSERT INTO bookings (
  license_plate,
  booking_date,
  booking_time,
  service_name,
  customer_name,
  customer_phone,
  customer_email,
  notes,
  status
) VALUES (
  'ABC-123',
  CURRENT_DATE + INTERVAL '1 day',
  '10:00',
  'Tire mounting',
  'John Doe',
  '+358 40 123 4567',
  'john.doe@example.com',
  'Please use summer tires',
  'confirmed'
);

-- Insert sample blocked slot
INSERT INTO blocked_slots (
  date,
  start_time,
  end_time,
  reason
) VALUES (
  CURRENT_DATE + INTERVAL '2 days',
  '12:00',
  '13:00',
  'Lunch break'
);

-- ============================================
-- CLEANUP (if needed)
-- ============================================

-- Delete all bookings (CAREFUL!)
-- DELETE FROM bookings;

-- Delete all blocked slots (CAREFUL!)
-- DELETE FROM blocked_slots;

-- Delete sample data only
-- DELETE FROM bookings WHERE license_plate = 'ABC-123';
-- DELETE FROM blocked_slots WHERE reason = 'Lunch break';

-- ============================================
-- GRANT PERMISSIONS (if needed)
-- ============================================

-- Grant permissions to anon role (for public access)
GRANT SELECT, INSERT ON bookings TO anon;
GRANT SELECT ON blocked_slots TO anon;

-- Grant all permissions to authenticated role
GRANT ALL ON bookings TO authenticated;
GRANT ALL ON blocked_slots TO authenticated;

-- Grant permissions on sequences (for UUID generation)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- COMPLETE! ✅
-- ============================================

-- Your tables are now set up and ready to use!
-- 
-- Next steps:
-- 1. Test creating a booking from the website
-- 2. Check the bookings table in Supabase
-- 3. Verify bookings appear in the CMS
-- 4. Test blocking time slots in the CMS
