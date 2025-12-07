# Admin CMS - Quick Reference Card

## 🚀 Quick Start

### First Time Setup
1. Create admin user in Supabase (see details below)
2. Go to `/admin/schedule`
3. Login: `admin@mitra-auto.fi` / `Kangaroo1234!`
4. Change password (required)
5. Access admin panel

### Database Setup
```sql
-- Create blocked_slots table
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
CREATE POLICY "Allow all for dev" ON blocked_slots FOR ALL TO authenticated USING (true);
```

### Create Admin User
**Supabase Dashboard** → Authentication → Users → Add user:
- Email: `admin@mitra-auto.fi`
- Password: `Kangaroo1234!`
- Auto Confirm: ✅
- Add metadata: `{"needs_password_change": true}`

---

## 🔐 Admin Credentials

**Email**: `admin@mitra-auto.fi`  
**Password**: `Kangaroo1234!` (first time only - must change)

**New Password Requirements**:
- ✅ 8+ characters
- ✅ Uppercase letter
- ✅ Lowercase letter
- ✅ Number
- ✅ Special character

---

## 📍 Access Points

| Feature | URL | Auth Required |
|---------|-----|--------------|
| **Admin Login** | `/admin/schedule` (redirects) | No |
| **Admin Schedule** | `/admin/schedule` (after auth) | Yes |
| **Main Site** | `/` | No |

---

## ⌨️ Common Tasks

### Login
1. Go to `/admin/schedule`
2. Enter email and password
3. Click Login

### Change Password (First Time)
1. After first login, you'll see password change page
2. Enter new password twice
3. Must meet all requirements (checkmarks)
4. Click Update Password

### View Schedule
- Select date from calendar (left sidebar)
- Or use quick filters: Today / Tomorrow
- View time slots: Gray (available), Blue (booked), Red (blocked)

### Block a Time Slot
1. Click any available (gray) slot
2. Drawer opens on right
3. Enter reason (optional)
4. Click "Block This Slot" or "Block Until End of Day"

### View Bookings
1. Click any booked (blue) slot
2. See all license plates and times
3. Close drawer when done

### Unblock a Slot
1. Click blocked (red) slot
2. Click "Unblock Slot"

### Logout
- Click Logout button in top bar (upper right)

---

## 🎨 Visual Guide

### Slot Colors
- 🔘 **Gray** = Available
- 🔵 **Blue** = Booked (shows count)
- 🔴 **Red** = Blocked (admin blocked)

### Business Hours
- **Mon-Fri**: 09:00 - 18:00
- **Sat**: 10:00 - 17:00
- **Sun**: Closed

### Slot Duration
- Each slot = 30 minutes
- Multiple bookings per slot allowed
- Slot unavailable only when blocked by admin

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't login | ✅ Check credentials<br>✅ Verify user exists in Supabase |
| Stuck in password change | ✅ Check metadata: `needs_password_change: false`<br>✅ Update manually in Supabase if needed |
| No slots showing | ✅ Check if Sunday (closed)<br>✅ Verify date selected<br>✅ Check database connection |
| Can't block slots | ✅ Verify `blocked_slots` table exists<br>✅ Check RLS policies<br>✅ Check console for errors |

---

## 📚 Full Documentation

| Document | Purpose |
|----------|---------|
| `/ADMIN_AUTH_SETUP.md` | Create admin user |
| `/ADMIN_AUTH_IMPLEMENTATION.md` | Auth system details |
| `/ADMIN_SCHEDULE_SETUP.md` | Database setup |
| `/ADMIN_SCHEDULE_QUICKSTART.md` | 5-minute tutorial |
| `/ADMIN_SCHEDULE_TEST_DATA.md` | Sample data |
| `/components/admin/README.md` | Full CMS docs |

---

## 🔒 Security Reminders

- ⚠️ Change default password immediately
- ⚠️ Never share admin credentials
- ⚠️ Log out when done
- ⚠️ Use HTTPS in production
- ⚠️ Enable RLS policies before production

---

## 📞 Support

**Common Issues**:
1. Login problems → Check `/ADMIN_AUTH_SETUP.md`
2. Database errors → Check `/ADMIN_SCHEDULE_SETUP.md`
3. Testing help → Check `/ADMIN_SCHEDULE_TEST_DATA.md`

**Console Errors**:
- Open browser DevTools (F12)
- Check Console tab for error messages
- Check Network tab for failed requests

---

## 🎯 Quick Command Reference

### Test Data Insert
```sql
-- Sample booking
INSERT INTO bookings (license_plate, booking_date, booking_time, created_at)
VALUES ('ABC-123', CURRENT_DATE, '09:00', NOW());

-- Block lunch hour
INSERT INTO blocked_slots (date, start_time, end_time, reason)
VALUES (CURRENT_DATE, '12:00', '13:00', 'Lunch break');
```

### Check Admin User
```sql
SELECT email, raw_user_meta_data 
FROM auth.users 
WHERE email = 'admin@mitra-auto.fi';
```

### Reset Password Change Flag
```sql
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"needs_password_change": false}'::jsonb
WHERE email = 'admin@mitra-auto.fi';
```

---

**Print this page and keep it handy for quick reference!**

---

**Version**: 1.0  
**Last Updated**: November 2025
