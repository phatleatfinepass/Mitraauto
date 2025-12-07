# ✅ Beta Fix - Bookings Not Showing in CMS

## What Was Fixed

Added **debug logging** to help diagnose why bookings aren't showing:

### 1. Booking Creation (BookingStep3.tsx)
- ✅ Logs booking data before saving
- ✅ Shows exact date/time to check in CMS
- ✅ Detailed error messages

### 2. CMS Display (AdminSchedulePage.tsx)
- ✅ Logs when fetching bookings
- ✅ Shows what data was retrieved
- ✅ Graceful handling if tables don't exist
- ✅ Counts bookings loaded

---

## Console Logs You'll See

### When Creating Booking:
```
[BOOKING] Creating booking with data: {...}
[BOOKING] ✅ Booking created successfully
[BOOKING] Check CMS for date: 2025-11-19 time: 10:00
```

### When Opening CMS:
```
[CMS] Fetching bookings for date: 2025-11-19
[CMS] Fetched bookings: [...]
[CMS] Time slots built: 1 with bookings
```

---

## Setup Required

**You must create the database tables first!**

### Quick SQL (Run in Supabase):

```sql
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_plate VARCHAR(20),
  booking_date DATE,
  booking_time VARCHAR(5),
  service_name TEXT,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(50),
  customer_email VARCHAR(255),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blocked_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE,
  start_time VARCHAR(5),
  end_time VARCHAR(5),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON bookings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON blocked_slots FOR ALL USING (true) WITH CHECK (true);
```

---

## Testing

**1. Create Test Booking**:
- License: TEST-123
- Date: Tomorrow
- Time: 10:00

**2. Check Console**:
- Should see `[BOOKING] ✅ Booking created`
- Note the date shown

**3. Open CMS**:
- Go to `/cms`
- Navigate to the date from console log
- Should see TEST-123 at 10:00

**4. If not showing**:
- Check console for `[CMS]` logs
- Verify date matches
- Check Supabase table directly

---

## Troubleshooting

### Console shows "table does not exist"
→ Run the SQL script above

### Booking saved but not in CMS
→ Check you're viewing the correct date
→ Hard refresh CMS (Ctrl+Shift+R)
→ Look at console logs

### No console logs appear
→ Clear browser cache
→ Hard refresh (Ctrl+Shift+R)

---

## Files Modified

1. **`/components/BookingStep3.tsx`**
   - Added `[BOOKING]` console logs
   - Better error details

2. **`/components/admin/AdminSchedulePage.tsx`**
   - Added `[CMS]` console logs
   - Graceful error handling
   - Table existence checking

---

## Documentation

- **Setup**: `/BETA_SETUP.md`
- **Debug**: `/CMS_DEBUG_CARD.md`
- **Tables**: `/BOOKINGS_TABLE_SETUP.sql`

---

## Status

✅ **Debug logging added**  
⏳ **Waiting for database setup**  
📝 **Test with browser console open**

---

**Next Step**: Run the SQL script, then test a booking with console open (F12)
