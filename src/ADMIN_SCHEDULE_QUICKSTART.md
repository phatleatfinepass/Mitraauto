# Admin Scheduling - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Create Database Table
Open Supabase SQL Editor and run:

```sql
CREATE TABLE blocked_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_blocked_slots_date ON blocked_slots(date);

ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for dev" ON blocked_slots 
  FOR ALL TO authenticated USING (true);
```

### Step 2: Add Test Data (Optional)
```sql
-- Today's test bookings
INSERT INTO bookings (license_plate, booking_date, booking_time, created_at)
VALUES 
  ('ABC-123', CURRENT_DATE, '09:00', NOW()),
  ('XYZ-789', CURRENT_DATE, '09:00', NOW()),
  ('DEF-456', CURRENT_DATE, '10:30', NOW());

-- Block lunch hour
INSERT INTO blocked_slots (date, start_time, end_time, reason)
VALUES (CURRENT_DATE, '12:00', '13:00', 'Lunch break');
```

### Step 3: Open Admin Page
Navigate to: **`/admin/schedule`**

That's it! 🎉

---

## 📖 5-Minute Tutorial

### View Today's Schedule
✅ **Already done!** Page loads with today by default.

### Navigate to Different Day
1. Click calendar on left sidebar
2. Select any date
3. Schedule updates automatically

### Block a Time Slot
1. Click any gray (available) slot
2. Type reason: "Team meeting"
3. Click "Block This Slot"
4. Slot turns red ✅

### Block Rest of Day
1. Click a slot (e.g., 16:00)
2. Type reason: "Closing early"
3. Click "Block Until End of Day"
4. All slots 16:00+ turn red ✅

### View Booking Details
1. Click any blue (booked) slot
2. See all license plates
3. Check creation times

### Unblock a Slot
1. Click red (blocked) slot
2. Click "Unblock Slot"
3. Slot turns gray ✅

---

## 🎯 Common Tasks

| Task | Steps |
|------|-------|
| **View specific date** | Calendar → Pick date |
| **Jump to today** | Click "Today" button |
| **Jump to tomorrow** | Click "Tomorrow" button |
| **Check total bookings** | Look at top bar stats |
| **Block emergency** | Click slot → Block Until EOD |
| **Weekly maintenance** | Navigate day by day, block same slots |

---

## 💡 Pro Tips

1. **Multiple bookings per slot**: System supports overlapping bookings. Blue badge shows count.

2. **License plate preview**: Booked slots show first 2 plates. Click for full list.

3. **Reason is optional**: Can block without entering reason, but it's helpful for team.

4. **End of day blocking**: Fastest way to close remaining hours.

5. **Theme support**: Toggle dark/light mode in navbar (works everywhere).

6. **Bilingual**: Switch Finnish ↔ English in navbar (UI updates).

7. **Business hours**: Automatically adjusts:
   - Weekdays: 9am-6pm
   - Saturday: 10am-5pm  
   - Sunday: Closed

---

## ⚡ Keyboard Shortcuts (Future)

Coming in v0.2:
- `T` - Today
- `→` - Next day
- `←` - Previous day
- `Esc` - Close drawer

---

## 🐛 Troubleshooting

### "No slots showing"
- ✅ Check if Sunday (shows "Closed" message)
- ✅ Verify database has `blocked_slots` table
- ✅ Check browser console for errors

### "Can't block slots"
- ✅ Verify Supabase RLS policy allows inserts
- ✅ Check authentication status
- ✅ Look for error toast notification

### "Data not loading"
- ✅ Check Supabase connection
- ✅ Verify table names match (`bookings`, `blocked_slots`)
- ✅ Check browser network tab for failed requests

### "Blocked slots not showing"
- ✅ Verify date matches (`CURRENT_DATE` vs selected date)
- ✅ Check time format is "HH:MM" (e.g., "09:00" not "9:00")
- ✅ Ensure `start_time` < `end_time`

---

## 📊 Understanding the Interface

### Slot Colors
- 🔘 **Gray** = Available (no bookings, not blocked)
- 🔵 **Blue** = Booked (one or more bookings exist)
- 🔴 **Red** = Blocked (admin blocked, unavailable)

### Badges
- **Booked (N)** = N bookings in this slot
- **Blocked** = Slot is blocked
- **+N** = N more bookings (when showing license plate preview)

### Summary Stats
- **Total Bookings** = All bookings for selected day
- **Blocked Slots** = Number of 30-min blocks that are unavailable

---

## 🔐 Security Reminder

⚠️ **For Production:**
1. Add admin authentication
2. Check user role before allowing access
3. Add audit logging
4. Update RLS policies
5. Sanitize input

**Current status**: Development mode, no auth required.

---

## 📚 More Help

- **Full Documentation**: `/components/admin/README.md`
- **Setup Guide**: `/ADMIN_SCHEDULE_SETUP.md`
- **Test Data**: `/ADMIN_SCHEDULE_TEST_DATA.md`
- **Implementation**: `/ADMIN_SCHEDULE_IMPLEMENTATION.md`
- **Visual Guide**: `/ADMIN_SCHEDULE_VISUAL_GUIDE.md`

---

## ✅ Quick Check

After setup, you should see:
- [ ] Top bar with "Scheduling" title
- [ ] Summary stats (bookings and blocked counts)
- [ ] Calendar on left sidebar
- [ ] Time slots grid in center (09:00-18:00 on weekdays)
- [ ] Any test bookings appear as blue slots
- [ ] Any blocked times appear as red slots
- [ ] Clicking a slot opens detail drawer on right

**All checked?** You're ready to use the admin scheduling system! 🎉

---

**Need Help?** Check documentation files listed above or review the component code in `/components/admin/AdminSchedulePage.tsx`.
