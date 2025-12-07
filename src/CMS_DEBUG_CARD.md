# 🔍 CMS Debug Card - Booking Not Showing

## Quick Diagnosis

### Step 1: Check Console After Booking

**Open browser console (F12)** after submitting booking:

```
✅ GOOD - Booking saved:
[BOOKING] ✅ Booking created successfully
[BOOKING] Booking ID: abc-123-def
[BOOKING] Check CMS for date: 2025-11-19 time: 10:00

❌ BAD - Error:
[BOOKING] ❌ Booking error: relation "bookings" does not exist
→ Solution: Run SQL setup script
```

---

### Step 2: Check Supabase

**Go to**: Supabase → Table Editor → bookings

```
✅ GOOD - Booking exists:
| id  | license_plate | booking_date | booking_time |
|-----|---------------|--------------|--------------|
| ... | TEST-123      | 2025-11-19   | 10:00        |

❌ BAD - Table doesn't exist:
"Table bookings not found"
→ Solution: Run SQL setup script

❌ BAD - Table empty:
No rows shown
→ Check console for booking errors
```

---

### Step 3: Check CMS Console

**Go to `/cms`** and check console:

```
✅ GOOD - Bookings loaded:
[CMS] Fetching bookings for date: 2025-11-19
[CMS] Fetched bookings: [{...}, {...}]
[CMS] Time slots built: 2 with bookings

❌ BAD - Table error:
[CMS] Bookings fetch error: relation does not exist
→ Solution: Run SQL setup script

❌ BAD - No bookings found:
[CMS] Fetched bookings: []
→ Check you're viewing the correct date
```

---

## 🎯 Common Issues

### Issue 1: Wrong Date in CMS

**Problem**: Created booking for Nov 19, but CMS shows Nov 18

**Solution**:
1. Check console log: `[BOOKING] Check CMS for date: 2025-11-19`
2. Navigate CMS to exact date shown
3. Look at exact time slot

---

### Issue 2: Tables Don't Exist

**Console shows**: `relation "bookings" does not exist`

**Solution**: Run this SQL in Supabase:

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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE POLICY "Allow all for beta - bookings" 
  ON bookings FOR ALL USING (true) WITH CHECK (true);
  
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
```

---

### Issue 3: Time Zone Mismatch

**Problem**: Booking shows different date in database

**Check**:
```sql
SELECT 
  booking_date,
  booking_time,
  license_plate,
  created_at
FROM bookings
ORDER BY created_at DESC
LIMIT 5;
```

**If dates don't match**: Dates are now formatted in local time, should be correct.

---

## 🔧 Quick Fixes

### Fix 1: Verify Booking Saved

```sql
SELECT * FROM bookings 
WHERE license_plate = 'TEST-123' 
ORDER BY created_at DESC;
```

**Should return**: Your test booking

---

### Fix 2: Check Exact Date Format

**In console after booking**:
```
[BOOKING] Check CMS for date: 2025-11-19 time: 10:00
```

**Copy this date**, go to CMS, make sure calendar shows same date.

---

### Fix 3: Force Refresh CMS

1. Go to `/cms`
2. Press Ctrl/Cmd + Shift + R (hard refresh)
3. Check console for fetch logs
4. Navigate to booking date

---

## 📊 Debug Checklist

**Run through this list**:

1. [ ] SQL tables created in Supabase
2. [ ] Booking form submits without error
3. [ ] Console shows `[BOOKING] ✅ Booking created`
4. [ ] Booking exists in Supabase table
5. [ ] CMS calendar opened
6. [ ] Navigated to correct date (check console log)
7. [ ] Looking at correct time slot
8. [ ] Console shows `[CMS] Fetched bookings`
9. [ ] Hard refreshed CMS page

---

## 💡 Expected Console Output

### Successful Flow:

**1. After creating booking**:
```
[BOOKING] Creating booking with data: {
  license_plate: "TEST-123",
  booking_date: "2025-11-19",
  booking_time: "10:00",
  ...
}
[BOOKING] ✅ Booking created successfully: [{id: "...", ...}]
[BOOKING] Booking ID: abc-123-def
[BOOKING] Check CMS for date: 2025-11-19 time: 10:00
```

**2. When opening CMS**:
```
[CMS] Fetching bookings for date: 2025-11-19
[CMS] Fetched bookings: [{
  id: "abc-123-def",
  license_plate: "TEST-123",
  booking_date: "2025-11-19",
  booking_time: "10:00",
  ...
}]
[CMS] Fetched blocked slots: []
[CMS] Time slots built: 1 with bookings
```

---

## 🎯 If Still Not Working

**Run full diagnostic**:

```sql
-- 1. Check table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'bookings';

-- 2. Check all bookings
SELECT * FROM bookings 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Check specific date
SELECT * FROM bookings 
WHERE booking_date = '2025-11-19';

-- 4. Count bookings
SELECT COUNT(*) FROM bookings;
```

**Share results** from console logs and SQL queries for further help.

---

## 📞 Quick Commands

**Supabase SQL**:
```sql
-- View all bookings
SELECT * FROM bookings ORDER BY created_at DESC;

-- Delete test bookings
DELETE FROM bookings WHERE license_plate LIKE 'TEST%';

-- Check tomorrow's bookings
SELECT * FROM bookings WHERE booking_date = CURRENT_DATE + 1;
```

---

**Status**: Beta v0.1 with Debug Logging  
**Console logs**: `[BOOKING]` and `[CMS]` prefixes  
**Setup guide**: See `/BETA_SETUP.md`
