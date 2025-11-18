# Admin Authentication Setup Guide

## Overview
This guide explains how to set up admin authentication for the Mitra Auto CMS.

## Admin Credentials

**Default Admin Account:**
- Email: `admin@mitra-auto.fi`
- Password (first time): `Kangaroo1234!`
- **IMPORTANT**: Admin will be forced to change password on first login

## Setup Steps

### Step 1: Create Admin User in Supabase

You have two options:

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Users**
3. Click **"Add user"** or **"Invite user"**
4. Fill in:
   - **Email**: `admin@mitra-auto.fi`
   - **Password**: `Kangaroo1234!`
   - **Auto Confirm User**: ✅ (Check this box)
5. Click **"Create user"** or **"Send invite"**
6. After user is created, click on the user to edit
7. Go to **"User Metadata"** section
8. Add a new metadata field:
   - Key: `needs_password_change`
   - Value: `true`
9. Save the user

#### Option B: Using SQL (Alternative)

Run this SQL in your Supabase SQL Editor:

```sql
-- Insert admin user with auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@mitra-auto.fi',
  crypt('Kangaroo1234!', gen_salt('bf')),
  now(),
  '{"needs_password_change": true}'::jsonb,
  now(),
  now()
);
```

**Note**: This requires proper Supabase extensions. Option A is recommended.

### Step 2: Verify Authentication Tables

Ensure Row Level Security (RLS) policies allow authentication:

```sql
-- Check if auth schema is accessible
SELECT * FROM auth.users WHERE email = 'admin@mitra-auto.fi';
```

If you get an error, you may need to grant permissions (typically not needed in Supabase).

### Step 3: Test Login

1. Navigate to `/admin/schedule` in your browser
2. You'll be redirected to the admin login page
3. Enter:
   - Email: `admin@mitra-auto.fi`
   - Password: `Kangaroo1234!`
4. Click **"Login"**
5. You'll be redirected to **Change Password** page
6. Enter a new secure password that meets these requirements:
   - At least 8 characters
   - Contains uppercase letter (A-Z)
   - Contains lowercase letter (a-z)
   - Contains number (0-9)
   - Contains special character (!@#$%^&*)
7. Confirm the new password
8. Click **"Update Password"**
9. You'll be logged in to the admin schedule page

## Security Features

### 1. Admin-Only Access
- Only users with email `admin@mitra-auto.fi` can access admin pages
- Other authenticated users are rejected

### 2. Forced Password Change
- First login requires password change
- Tracked via `needs_password_change` in user metadata
- After password change, flag is set to `false`

### 3. Session Management
- Uses Supabase Auth sessions
- Automatic session refresh
- Logout clears session completely

### 4. Password Requirements
Strong password policy enforced:
- Minimum 8 characters
- Must include uppercase letter
- Must include lowercase letter
- Must include number
- Must include special character

### 5. Protected Routes
- `/admin/schedule` requires authentication
- Unauthenticated users see login page
- Users needing password change see password change page

## User Experience Flow

```
1. User navigates to /admin/schedule
   ↓
2. No session? → Show Login Page
   ↓
3. Login successful
   ↓
4. Check: needs_password_change = true?
   ↓
   YES → Show Password Change Page
   ↓
   NO → Show Admin Schedule Page
   ↓
5. Admin can logout anytime (button in top bar)
```

## Troubleshooting

### Cannot login
- ✅ Verify user exists: Check Supabase Dashboard → Authentication → Users
- ✅ Check email is exactly `admin@mitra-auto.fi`
- ✅ Verify password is correct
- ✅ Check browser console for errors
- ✅ Verify Supabase project URL and keys in environment variables

### Stuck in password change loop
- ✅ Verify `needs_password_change` metadata was set to `false` after change
- ✅ Check Supabase Dashboard → Users → Select admin user → User Metadata
- ✅ Manually set `needs_password_change` to `false` if needed

### "Unauthorized" error
- ✅ Confirm email is `admin@mitra-auto.fi` (case sensitive)
- ✅ Check AdminAuthContext.tsx logic for admin verification

### Session expired quickly
- ✅ Check Supabase project settings → Auth → JWT expiry
- ✅ Default is 3600 seconds (1 hour)
- ✅ Session auto-refreshes, but may need manual refresh on errors

## Adding More Admins (Future)

For production, you'll want to:

1. **Create an admin role system**:
   - Add `role` field to user metadata
   - Check `role === 'admin'` instead of checking email
   - Store admin emails in database table

2. **Admin management page**:
   - Create interface to add/remove admins
   - Require super-admin permission
   - Audit log for admin actions

3. **Multi-level permissions**:
   - Super Admin (full access)
   - Schedule Admin (schedule only)
   - View-Only Admin (read-only)

## Password Reset (Future Enhancement)

Currently, password reset must be done via Supabase Dashboard. For production:

1. Implement "Forgot Password" flow
2. Use Supabase password reset emails
3. Create password reset page
4. Configure email templates in Supabase

## Current Limitations

1. **Single admin only**: Only `admin@mitra-auto.fi` can access CMS
2. **No role system**: Future enhancement needed
3. **No forgot password**: Must reset via Supabase dashboard
4. **No 2FA**: Two-factor authentication not implemented
5. **No audit trail**: Admin actions not logged yet

## Next Steps After Setup

Once admin authentication is working:

1. **Test the full flow**:
   - Login → Password Change → Access Schedule → Logout

2. **Create blocked_slots table** (if not done):
   - See `/ADMIN_SCHEDULE_SETUP.md`

3. **Add test data** (optional):
   - See `/ADMIN_SCHEDULE_TEST_DATA.md`

4. **Secure for production**:
   - Change default password immediately
   - Enable RLS policies
   - Add audit logging
   - Implement rate limiting

## Security Best Practices

✅ **DO**:
- Change default password immediately after first login
- Use a password manager
- Log out when done
- Use HTTPS in production
- Enable Supabase RLS policies
- Monitor auth logs regularly

❌ **DON'T**:
- Share admin credentials
- Use the default password in production
- Leave admin sessions open on shared computers
- Access admin panel on public WiFi without VPN
- Store passwords in code or plain text

---

**Created**: [Current Date]  
**Version**: 1.0  
**Status**: Ready for use ✅
