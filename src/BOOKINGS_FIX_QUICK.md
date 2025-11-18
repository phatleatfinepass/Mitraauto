# ⚡ Bookings Fix - Quick Setup

## 🎯 Problem Fixed

**Before**: Bookings success but not showing in CMS ❌  
**After**: Bookings save to Supabase and show in CMS ✅

---

## 🚀 3-Step Fix

### Step 1: Create Tables (2 minutes)

**Go to**: Supabase Dashboard → SQL Editor → New Query

**Paste and run**:
```sql
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

CREATE TABLE IF NOT EXISTS blocked_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  start_time VARCHAR(5) NOT NULL,
  end_time VARCHAR(5) NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_blocked_slots_date ON blocked_slots(date);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for bookings" 
  ON bookings FOR ALL USING (true) WITH CHECK (true);
  
CREATE POLICY "Enable all for blocked_slots" 
  ON blocked_slots FOR ALL USING (true) WITH CHECK (true);
```

---

### Step 2: Verify Tables (30 seconds)

**Run this**:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('bookings', 'blocked_slots');
```

**Should see**:
- ✅ bookings
- ✅ blocked_slots

---

### Step 3: Test Booking (1 minute)

**On website**:
```
1. Click "Book a Service"
2. Fill form:
   - License: TEST-123
   - Date: Tomorrow
   - Time: 10:00
   - Service: Tire mounting
   - Name: Test User
   - Phone: +358 40 123 4567
3. Confirm
```

**In CMS** (`/cms`):
```
1. Go to tomorrow's date
2. Look at 10:00
3. ✅ See TEST-123 booking
```

---

## ✅ Success!

**If you see the booking in CMS**, everything is working! 🎉

**If not**, see `/BOOKINGS_FIX_GUIDE.md` for troubleshooting.

---

## 🔍 Quick Verify

**Check in Supabase**:
```sql
SELECT * FROM bookings ORDER BY created_at DESC LIMIT 5;
```

**Should show your test booking** ✅

---

## 📝 What Changed

**File**: `/components/BookingStep3.tsx`

**Before**: Mock setTimeout (fake save)  
**After**: Real Supabase insert (real save)

**Result**: Bookings now persist and show in CMS!

---

## 🎯 Quick Test Checklist

- [ ] SQL script run in Supabase
- [ ] Tables created (bookings, blocked_slots)
- [ ] Test booking created on website
- [ ] Booking appears in Supabase table
- [ ] Booking visible in CMS at /cms
- [ ] No console errors

**All checked?** You're done! ✅

---

**For detailed guide**: See `/BOOKINGS_FIX_GUIDE.md`  
**For SQL script**: See `/BOOKINGS_TABLE_SETUP.sql`

---

**Status**: Fixed ✅  
**Time to setup**: ~3 minutes  
**Difficulty**: ⭐☆☆☆☆ (Very Easy)
