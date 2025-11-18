# 🔧 Bookings Fix Guide - Complete Setup

## 🎯 Issues Fixed

### Issue 1: Bookings Not Saving ✅
**Problem**: Booking form success but bookings not showing in CMS  
**Cause**: BookingStep3.tsx was using mock setTimeout instead of saving to Supabase  
**Solution**: Updated to save bookings to Supabase `bookings` table

### Issue 2: Schedule Not Showing in CMS ✅
**Problem**: CMS schedule empty even with bookings  
**Cause**: Missing `bookings` and `blocked_slots` tables in Supabase  
**Solution**: Created SQL setup script to create required tables

---

## 🚀 Quick Fix (3 Steps)

### Step 1: Create Tables in Supabase

**Go to**: Supabase Dashboard → SQL Editor → New Query

**Copy and paste this SQL**:

```sql
-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_plate VARCHAR(20) NOT NULL,
  booking_date DATE NOT NULL,
  booking_time VARCHAR(5) NOT NULL,
  service_name TEXT NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  customer_email VARCHAR(255),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create blocked_slots table
CREATE TABLE IF NOT EXISTS blocked_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  start_time VARCHAR(5) NOT NULL,
  end_time VARCHAR(5) NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_date_time ON bookings(booking_date, booking_time);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_date ON blocked_slots(date);

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable all for bookings" ON bookings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for blocked_slots" ON blocked_slots FOR ALL USING (true) WITH CHECK (true);
```

**Click**: Run (or Cmd/Ctrl + Enter)

---

### Step 2: Verify Tables Created

**Run this query to verify**:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('bookings', 'blocked_slots');

-- Should return:
-- bookings
-- blocked_slots
```

---

### Step 3: Test Booking Flow

**On your website**:
```
1. Click "Book a Service"
2. Fill in:
   - License plate: TEST-123
   - Date: Tomorrow
   - Time: 10:00
   - Service: Tire mounting
   - Name: Test User
   - Phone: +358 40 123 4567
3. Confirm booking
4. ✅ Should show success
```

**In CMS**:
```
1. Go to: /cms
2. Select tomorrow's date
3. Look at 10:00 time slot
4. ✅ Should see TEST-123 booking
```

---

## 📝 What Was Changed

### File: `/components/BookingStep3.tsx`

#### Before (Mock):
```typescript
setLoading(true);
try {
  // [BOOKING ACTION] Create booking: /api/bookings/create
  await new Promise(resolve => setTimeout(resolve, 1000));
  onConfirm();
} catch (err) {
  setError('Unable to complete booking. Please try again.');
}
```

#### After (Real Supabase):
```typescript
setLoading(true);
try {
  const supabase = getSupabaseClient();
  const bookingDate = date.toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('bookings')
    .insert([{
      license_plate: licensePlate.toUpperCase(),
      booking_date: bookingDate,
      booking_time: timeSlot,
      service_name: serviceName,
      customer_name: contactInfo.name,
      customer_phone: contactInfo.phone,
      customer_email: contactInfo.email || null,
      notes: contactInfo.notes || null,
      status: 'confirmed',
    }])
    .select();

  if (error) throw error;
  console.log('Booking created successfully:', data);
  onConfirm();
} catch (err) {
  console.error('Booking error:', err);
  setError('Unable to complete booking. Please try again.');
}
```

**Changes**:
- ✅ Added Supabase import
- ✅ Real database insert instead of mock
- ✅ Proper error handling
- ✅ Console logging for debugging

---

## 📊 Database Schema

### Bookings Table Structure

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `license_plate` | VARCHAR(20) | Vehicle license plate |
| `booking_date` | DATE | Date of booking (YYYY-MM-DD) |
| `booking_time` | VARCHAR(5) | Time slot (HH:MM format) |
| `service_name` | TEXT | Name of service(s) |
| `customer_name` | VARCHAR(255) | Customer full name |
| `customer_phone` | VARCHAR(50) | Customer phone number |
| `customer_email` | VARCHAR(255) | Customer email (optional) |
| `notes` | TEXT | Additional notes (optional) |
| `status` | VARCHAR(50) | Booking status (default: confirmed) |
| `created_at` | TIMESTAMPTZ | When booking was created |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### Blocked Slots Table Structure

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `date` | DATE | Date of blocked slot |
| `start_time` | VARCHAR(5) | Start time (HH:MM) |
| `end_time` | VARCHAR(5) | End time (HH:MM) |
| `reason` | TEXT | Reason for blocking (optional) |
| `created_at` | TIMESTAMPTZ | When slot was blocked |

---

## 🔍 Verification Steps

### 1. Check Tables Exist

**In Supabase Dashboard** → Table Editor:
```
✅ Should see "bookings" table
✅ Should see "blocked_slots" table
```

### 2. Test Booking Creation

**Create a test booking**:
```sql
INSERT INTO bookings (
  license_plate, booking_date, booking_time,
  service_name, customer_name, customer_phone
) VALUES (
  'TEST-999', 
  CURRENT_DATE + 1, 
  '14:00',
  'Test Service', 
  'Test User', 
  '+358 40 999 9999'
);
```

**Query to verify**:
```sql
SELECT * FROM bookings ORDER BY created_at DESC LIMIT 5;
```

### 3. Check CMS Display

**In CMS** (`/cms`):
```
1. Navigate to tomorrow's date
2. Look at 14:00 time slot
3. ✅ Should see TEST-999 booking
```

### 4. Test Blocking Slots

**In CMS**:
```
1. Click on empty time slot
2. Click "Block this slot"
3. Enter reason: "Testing"
4. ✅ Slot should show as blocked
```

**Verify in database**:
```sql
SELECT * FROM blocked_slots ORDER BY created_at DESC LIMIT 5;
```

---

## 🐛 Troubleshooting

### Issue: Tables not created

**Check error message in SQL Editor**  
**Common causes**:
- Permission denied → Use service_role key
- Table already exists → Use `DROP TABLE IF EXISTS` first (careful!)

**Solution**:
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

---

### Issue: Bookings save but don't show in CMS

**Check**:
1. Date format matches (YYYY-MM-DD)
2. Time format matches (HH:MM)
3. CMS is looking at correct date

**Debug query**:
```sql
-- See all bookings
SELECT 
  license_plate, 
  booking_date, 
  booking_time, 
  customer_name,
  created_at
FROM bookings 
ORDER BY booking_date, booking_time;
```

---

### Issue: "Permission denied" when booking

**Check RLS policies**:
```sql
-- View policies
SELECT * FROM pg_policies 
WHERE tablename IN ('bookings', 'blocked_slots');
```

**Fix**:
```sql
-- Re-create policies
DROP POLICY IF EXISTS "Enable all for bookings" ON bookings;
CREATE POLICY "Enable all for bookings" 
  ON bookings FOR ALL 
  USING (true) 
  WITH CHECK (true);
```

---

### Issue: Browser console shows errors

**Check browser console (F12)**:

**Error**: "relation 'bookings' does not exist"
- Solution: Run SQL setup script

**Error**: "null value in column 'customer_name'"
- Solution: Form validation issue, check all required fields filled

**Error**: "Failed to fetch"
- Solution: Check Supabase connection, verify anon key

---

## 📱 Testing Checklist

### Public Booking Flow

- [ ] Open booking modal
- [ ] Fill license plate (TEST-123)
- [ ] Select date (tomorrow)
- [ ] Select time (10:00)
- [ ] Choose service (Tire mounting)
- [ ] Enter name (Test User)
- [ ] Enter phone (+358 40 123 4567)
- [ ] Click confirm
- [ ] See success message
- [ ] Check Supabase table has booking
- [ ] Verify booking shows in CMS

### CMS Schedule Management

- [ ] Open /cms
- [ ] See calendar for current week
- [ ] Navigate to tomorrow
- [ ] See test booking at 10:00
- [ ] Click on booking - details appear
- [ ] Test blocking a time slot
- [ ] Verify blocked slot appears
- [ ] Test unblocking slot
- [ ] Create booking from CMS (if feature exists)

---

## 🎨 Data Flow

### Booking Creation Flow

```
User fills form
    ↓
BookingStep3.tsx validates
    ↓
getSupabaseClient() creates connection
    ↓
INSERT into bookings table
    ↓
Supabase saves to database
    ↓
Returns success/error
    ↓
Show success message
    ↓
Booking visible in CMS
```

### CMS Display Flow

```
User opens /cms
    ↓
AdminSchedulePage loads
    ↓
fetchScheduleData(date) called
    ↓
Query bookings WHERE booking_date = date
    ↓
Query blocked_slots WHERE date = date
    ↓
Build time slots array
    ↓
Match bookings to time slots
    ↓
Render calendar with bookings
```

---

## 📊 Sample Data

### Insert Sample Bookings

```sql
-- Sample booking 1
INSERT INTO bookings (
  license_plate, booking_date, booking_time,
  service_name, customer_name, customer_phone, customer_email
) VALUES (
  'ABC-123',
  CURRENT_DATE + 1,
  '09:00',
  'Basic service',
  'John Doe',
  '+358 40 111 1111',
  'john@example.com'
);

-- Sample booking 2
INSERT INTO bookings (
  license_plate, booking_date, booking_time,
  service_name, customer_name, customer_phone
) VALUES (
  'XYZ-789',
  CURRENT_DATE + 1,
  '10:30',
  'Tire mounting, Wheel balancing',
  'Jane Smith',
  '+358 40 222 2222'
);

-- Sample booking 3
INSERT INTO bookings (
  license_plate, booking_date, booking_time,
  service_name, customer_name, customer_phone, notes
) VALUES (
  'DEF-456',
  CURRENT_DATE + 2,
  '14:00',
  'Large service',
  'Bob Johnson',
  '+358 40 333 3333',
  'Please call before starting work'
);
```

### Insert Sample Blocked Slots

```sql
-- Lunch break
INSERT INTO blocked_slots (date, start_time, end_time, reason)
VALUES (CURRENT_DATE + 1, '12:00', '13:00', 'Lunch break');

-- End of day maintenance
INSERT INTO blocked_slots (date, start_time, end_time, reason)
VALUES (CURRENT_DATE + 2, '16:00', '18:00', 'Shop maintenance');
```

---

## ✅ Success Indicators

**Everything working when**:

1. ✅ Tables exist in Supabase
2. ✅ Booking form submits successfully
3. ✅ Success message appears
4. ✅ Booking visible in Supabase table
5. ✅ Booking appears in CMS at correct date/time
6. ✅ Can block/unblock time slots in CMS
7. ✅ No console errors
8. ✅ Calendar navigation works

---

## 📞 Quick Reference

### Important Queries

**View all bookings**:
```sql
SELECT * FROM bookings ORDER BY booking_date, booking_time;
```

**View today's bookings**:
```sql
SELECT * FROM bookings WHERE booking_date = CURRENT_DATE;
```

**View upcoming bookings**:
```sql
SELECT * FROM bookings 
WHERE booking_date >= CURRENT_DATE 
ORDER BY booking_date, booking_time;
```

**Count bookings by status**:
```sql
SELECT status, COUNT(*) 
FROM bookings 
GROUP BY status;
```

**Delete test bookings**:
```sql
DELETE FROM bookings WHERE license_plate LIKE 'TEST%';
```

---

## 📚 Related Files

| File | Purpose |
|------|---------|
| `/BOOKINGS_TABLE_SETUP.sql` | Complete SQL setup script |
| `/components/BookingStep3.tsx` | Updated booking submission |
| `/components/admin/AdminSchedulePage.tsx` | CMS schedule display |
| `/utils/supabase/client.tsx` | Supabase client |

---

## 🎉 Summary

**What was broken**:
- ❌ Bookings not saving to database (mock setTimeout)
- ❌ Tables didn't exist in Supabase
- ❌ CMS had no data to display

**What was fixed**:
- ✅ Real Supabase integration in BookingStep3
- ✅ SQL script to create required tables
- ✅ Proper data structure matching CMS expectations
- ✅ Complete setup guide with verification

**Status**: Ready to test! 🚀

---

**Next Steps**:
1. Run SQL script in Supabase
2. Test booking creation
3. Verify in CMS
4. Start using the system!

**Need help?** Check the troubleshooting section above.
