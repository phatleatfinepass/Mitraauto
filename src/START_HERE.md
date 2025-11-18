# 🚀 Mitra Auto Admin CMS - START HERE

## ✅ Two Ways to Access CMS

### 🆕 NEW: Direct Beta Access (No Login)
**For v0.1 Beta**: Access CMS instantly at `/cms`
- ✅ No authentication required
- ✅ No password needed
- ✅ Direct access to schedule

**Quick Access**: `https://www.mitra-auto.fi/cms`

**See**: `/CMS_ACCESS_QUICK.md` for details

---

### 🔐 Authenticated Access (Production)
**For secure access**: Use `/admin/schedule` with login
- ✅ Requires authentication
- ✅ Admin role verification
- ✅ Session persistence

---

## 🎯 Quick Setup Options

### Option 1: Beta Access (Instant) ⚡

**No setup required!** Just go to:
```
https://www.mitra-auto.fi/cms
```

✅ Instant access  
✅ No login  
✅ Full CMS features

---

### Option 2: Authenticated Access (30 Seconds)

### 1. Create/Reset Admin User in Supabase

**Go to**: Supabase Dashboard → Authentication → Users

**Option A - Create New User**:
- Click "Add User"
- Email: `admin@mitra-auto.fi`
- Password: `Kangaroo1234!`
- Auto Confirm: ✅ YES
- Click "Create User"

**Option B - Reset Existing User**:
- Search for: `admin@mitra-auto.fi`
- Click on user
- Edit password: `Kangaroo1234!`
- Save

**Need help?** See `/ADMIN_PASSWORD_RESET_QUICK.md`

### 2. Login

**Go to**: Your website - Click "Login" button anywhere

**Enter**:
- Email: `admin@mitra-auto.fi`
- Password: `Kangaroo1234!`

**Click**: Login

**Result**: Automatically redirects to `/admin/schedule`

### 3. Done! 🎉

You're now in the admin panel. Session will stay active until you logout.

---

## 📊 What's Fixed

| Issue | Status |
|-------|--------|
| Dashboard link not working | ✅ FIXED |
| Orders (not needed yet) | ⏭️ Skipped |
| Forced password change | ✅ REMOVED |
| Session not persisting | ✅ FIXED |

---

## 🔑 Important Changes

### ✨ Session Persistence
- **Login once** → Stay logged in
- **Close browser** → Still logged in
- **Refresh page** → Still logged in
- **Only logout button** → Ends session

### ✨ No Password Change Required
- Set password during user creation
- No forced change on first login
- Login goes directly to schedule

### ✨ Dashboard Link Fixed
- Click user icon → Dashboard → Goes to admin schedule
- Or navigate directly to `/admin/schedule`

---

## 🎯 How to Access Admin Panel

### 🆕 Method 1: Beta CMS (No Login) ⚡
```
URL: https://www.mitra-auto.fi/cms
Auth: None required
Status: v0.1 Beta
```

### Method 2: User Menu (With Login)
```
1. Login to site
2. Click user icon (top right)
3. Click "Dashboard"
```

### Method 3: Direct URL (With Login)
```
Navigate to: /admin/schedule
(Requires authentication)
```

All methods give you the same CMS features!

---

## 📝 Choose a Strong Password

Since there's no forced password change, choose a good one from the start:

**Good Examples**:
- `MitraAuto2024!Admin`
- `SecureAdmin@MA2024`
- `Admin!Secure#2024`

**Requirements**:
- 12+ characters
- Uppercase + lowercase
- Numbers
- Special characters

---

## 🧪 Quick Test

After creating user and logging in:

- [ ] Refresh page → Still logged in?
- [ ] Close and reopen browser → Still logged in?
- [ ] Click logout → Goes to login page?
- [ ] Login again → Works?

**All checked?** Perfect! You're ready to go. ✅

---

## 🗄️ Database Setup (If Not Done)

You also need the `blocked_slots` table:

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
CREATE POLICY "Allow all for dev" ON blocked_slots FOR ALL TO authenticated USING (true);
```

**Run this in**: Supabase SQL Editor

---

## 📚 Documentation

| Guide | When to Use |
|-------|-------------|
| **This File** | Quick setup |
| `/ADMIN_SETUP_UPDATED.md` | Detailed setup instructions |
| `/ADMIN_FIXES_SUMMARY.md` | What was fixed |
| `/ADMIN_QUICK_REFERENCE.md` | Quick reference card |

---

## 🐛 Troubleshooting

### Can't Login?
- ✅ Check email is exactly: `admin@mitra-auto.fi`
- ✅ Check password is correct
- ✅ Verify user exists in Supabase

### Session Not Persisting?
- ✅ Clear browser cache
- ✅ Login again
- ✅ Check browser console for errors

### Dashboard Link Not Working?
- ✅ Make sure you're logged in
- ✅ Try direct URL: `/admin/schedule`
- ✅ Check browser console

---

## ✨ Features Available

### Admin Schedule CMS:
- 📅 View daily bookings
- 🚫 Block time slots
- 👀 View booking details (license plates)
- 🔓 Unblock slots
- 📊 See booking statistics
- 🌓 Dark/light theme
- 🌍 Finnish/English

### Access Controls:
- 🔐 Admin-only access
- 💾 Persistent sessions
- 🚪 Secure logout
- 🔄 Auto token refresh

---

## 🎉 You're All Set!

### Next Steps:
1. ✅ Create admin user ← **Do this now**
2. ✅ Login at `/admin/schedule`
3. ✅ Start managing schedule

**Questions?** Check the detailed guides in the documentation.

---

## 🔐 Security Reminder

- 🔒 Use strong password
- 🚫 Never share credentials
- 🚪 Logout when done
- 💻 Use HTTPS in production

---

**Ready?** Create your admin user and get started! 🚀

---

**Version**: 2.0  
**Status**: Ready to use ✅  
**Last Updated**: November 2025
