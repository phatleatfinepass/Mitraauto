# Admin CMS - Updated Setup Guide

## ✅ Recent Updates

### Changes Made:
1. ✅ **Session Persistence Fixed** - Sessions now persist until logout
2. ✅ **Forced Password Change Removed** - No longer required on first login
3. ✅ **Dashboard Link Fixed** - Now correctly navigates to `/admin/schedule`
4. ✅ **Auto-refresh Enabled** - Sessions automatically refresh

---

## 🚀 Quick Setup (2 Steps)

### Step 1: Create Admin User in Supabase

**Option A: Supabase Dashboard (Recommended)**

1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Click **"Add user"**
3. Fill in:
   - **Email**: `admin@mitra-auto.fi`
   - **Password**: Choose a secure password (e.g., `MitraAdmin2024!`)
   - **Auto Confirm User**: ✅ Check this box
4. Click **"Create user"**

**Option B: SQL Method**

```sql
-- Create admin user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_confirmed_at,
  recovery_token,
  email_change_token_new,
  email_change
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@mitra-auto.fi',
  crypt('YourSecurePassword123!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  now(),
  '',
  '',
  '';
```

**Important**: Replace `YourSecurePassword123!` with your chosen password.

### Step 2: Access Admin Panel

1. **Login to main site** (if you have user accounts enabled)
2. Click on **User Icon** (top right)
3. Click **"Dashboard"** from dropdown
4. OR navigate directly to: `/admin/schedule`

---

## 📝 Recommended Password

Since forced password change is now disabled, choose a strong password from the start:

**Example Strong Passwords:**
- `MitraAuto2024!Secure`
- `Admin@Mitra#2024`
- `SecureAdmin!2024MA`

**Requirements:**
- At least 12 characters (recommended)
- Mix of uppercase and lowercase
- Include numbers
- Include special characters
- Don't use dictionary words

---

## 🔐 Default Credentials (You Set These)

When creating the admin user, YOU choose the password. There is no default password anymore.

**Email**: `admin@mitra-auto.fi` (fixed)
**Password**: [You choose during setup]

---

## 🎯 How to Access Admin Panel

### Method 1: Via User Menu (After Login)
```
1. Login to site as admin
   ↓
2. Click User Icon (top right corner)
   ↓
3. Click "Dashboard" in dropdown
   ↓
4. Admin Schedule page opens
```

### Method 2: Direct URL
```
Navigate to: /admin/schedule
   ↓
If not logged in → Login page appears
   ↓
Login with admin credentials
   ↓
Admin Schedule page opens
```

---

## ✨ Session Persistence

### How It Works Now:

✅ **Login once** → Stay logged in  
✅ **Close browser** → Still logged in when you return  
✅ **Refresh page** → Session maintained  
✅ **Auto-refresh** → Token automatically refreshes  
✅ **Only logout** → Manually clicking logout ends session

### Session Configuration:
```typescript
{
  persistSession: true,          // Saves session to localStorage
  storageKey: 'mitra-auto-auth', // Custom storage key
  autoRefreshToken: true,        // Automatically refreshes tokens
  detectSessionInUrl: true,      // Handles auth redirects
}
```

---

## 🔧 Troubleshooting

### "Dashboard link doesn't work"

**Fix:**
1. Make sure you're logged in as admin
2. Email must be exactly: `admin@mitra-auto.fi`
3. Try direct URL: `/admin/schedule`
4. Check browser console for errors

### "Session expires too quickly"

**This is now fixed!** Sessions persist until logout.

If still experiencing issues:
1. Clear browser cache and cookies
2. Login again
3. Check Supabase project settings → Auth → JWT expiry

### "Cannot login"

**Checklist:**
- ✅ Admin user created in Supabase?
- ✅ Email is `admin@mitra-auto.fi`?
- ✅ Password is correct?
- ✅ User is confirmed? (Auto Confirm should be checked)
- ✅ Check Supabase logs for errors

### "Logged out after refresh"

This should NOT happen anymore. If it does:
1. Check browser console for errors
2. Verify localStorage contains `mitra-auto-auth` key
3. Check Supabase auth settings

---

## 🗄️ Database Setup (If Not Done)

Create the `blocked_slots` table for the scheduling system:

```sql
-- Create blocked_slots table
CREATE TABLE IF NOT EXISTS blocked_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_blocked_slots_date ON blocked_slots(date);
CREATE INDEX idx_blocked_slots_time_range ON blocked_slots(date, start_time, end_time);

-- Enable RLS
ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users
CREATE POLICY "Allow authenticated users to manage blocked slots"
  ON blocked_slots
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

---

## 📊 Test the Setup

### Quick Test Checklist:

- [ ] Admin user created in Supabase
- [ ] Can login at `/admin/schedule`
- [ ] Session persists after page refresh
- [ ] Dashboard link in user menu works
- [ ] Can access schedule page
- [ ] Can logout successfully
- [ ] Can login again after logout
- [ ] Session persists across browser sessions

---

## 🛡️ Security Best Practices

### ✅ DO:
- Use a strong, unique password
- Use a password manager
- Enable 2FA in Supabase (project level)
- Monitor auth logs regularly
- Use HTTPS in production
- Log out when done on shared computers

### ❌ DON'T:
- Share admin credentials
- Use weak passwords
- Leave admin sessions open on public computers
- Access admin panel on public WiFi without VPN
- Store passwords in code or plain text

---

## 📈 What Changed from Previous Version

### Before:
- ❌ Forced password change on first login
- ❌ Session not persisting properly
- ❌ Dashboard link went to non-existent `/dashboard`
- ❌ Had to login again after refresh

### Now:
- ✅ No forced password change
- ✅ Session persists in localStorage
- ✅ Dashboard link goes to `/admin/schedule`
- ✅ Stay logged in until manual logout
- ✅ Auto token refresh enabled

---

## 🎉 You're All Set!

Once you've created the admin user:

1. **Navigate to** `/admin/schedule` or click Dashboard in user menu
2. **Login** with your chosen credentials
3. **Start managing** your schedule!

No password change required, sessions stay active, everything just works!

---

## 📚 Additional Documentation

- **Full Admin Guide**: `/components/admin/README.md`
- **Schedule Features**: `/ADMIN_SCHEDULE_IMPLEMENTATION.md`
- **Test Data**: `/ADMIN_SCHEDULE_TEST_DATA.md`
- **Quick Reference**: `/ADMIN_QUICK_REFERENCE.md`

---

**Version**: 2.0 (Updated)  
**Date**: November 2025  
**Status**: Ready to use ✅
