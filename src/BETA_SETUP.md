# 🚀 Beta Setup - Bookings System

## Quick Setup (5 minutes)

### Step 1: Create Database Tables

**Go to Supabase** → SQL Editor → New Query

**Copy and paste this**:

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

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_date_time ON bookings(booking_date, booking_time);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_date ON blocked_slots(date);

-- Enable RLS (but allow all for beta)
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for beta
CREATE POLICY "Allow all for beta - bookings" ON bookings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for beta - blocked_slots" ON blocked_slots FOR ALL USING (true) WITH CHECK (true);
```

**Click**: Run (or press Ctrl/Cmd + Enter)

---

### Step 2: Test Booking

**On your website**:
1. Click "Book a Service"
2. Fill in form:
   - License: TEST-123
   - Date: Tomorrow
   - Time: 10:00
   - Service: Any service
   - Name: Test User
   - Phone: +358 40 123 4567
3. Submit

**Open browser console (F12)**:
- Look for: `[BOOKING] ✅ Booking created successfully`
- Note the date and time shown

---

### Step 3: Check CMS

1. Go to `/cms`
2. Navigate to the date you booked (tomorrow)
3. Look at the 10:00 time slot
4. **You should see your TEST-123 booking**

---

## 🐛 Troubleshooting

### Tables don't exist error

**Console shows**: `table does not exist`

**Fix**: Run the SQL script from Step 1

---

### Booking created but not showing

**Check console for**:
```
[BOOKING] ✅ Booking created successfully
[BOOKING] Check CMS for date: 2025-11-19 time: 10:00
```

**Then**:
1. Go to CMS at `/cms`
2. **Make sure you're looking at the exact date shown**
3. Refresh the page
4. Check browser console for CMS logs:
   ```
   [CMS] Fetched bookings: [...]
   [CMS] Time slots built: X with bookings
   ```

---

### Still not working?

**Run this in Supabase SQL Editor**:

```sql
-- Check if booking was saved
SELECT * FROM bookings ORDER BY created_at DESC LIMIT 5;
```

**If you see your booking**, the issue is with CMS display.

**If you don't see your booking**, the issue is with saving.

---

## 🔍 Debug Mode

**Browser console logs will show**:

### When creating booking:
```
[BOOKING] Creating booking with data: {...}
[BOOKING] ✅ Booking created successfully
[BOOKING] Booking ID: xxx-xxx-xxx
[BOOKING] Check CMS for date: 2025-11-19 time: 10:00
```

### When viewing CMS:
```
[CMS] Fetching bookings for date: 2025-11-19
[CMS] Fetched bookings: [array of bookings]
[CMS] Fetched blocked slots: []
[CMS] Time slots built: 1 with bookings
```

---

## ✅ Success Checklist

- [ ] SQL script run in Supabase
- [ ] Tables created (bookings, blocked_slots)
- [ ] Test booking submitted
- [ ] Console shows success message
- [ ] Booking visible in Supabase table
- [ ] CMS shows booking at correct time
- [ ] No console errors

---

## 📞 Quick Reference

**Create booking**: Website → Book a Service  
**View bookings**: `/cms`  
**Check database**: Supabase → Table Editor → bookings  
**Debug**: Browser Console (F12)

---

**Status**: Beta v0.1  
**Setup time**: ~5 minutes  
**Complexity**: ⭐☆☆☆☆ Simple
