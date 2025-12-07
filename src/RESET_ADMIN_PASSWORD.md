# 🔑 Reset Admin Password - Step-by-Step Guide

## 📋 Admin Account Details

**Email**: `admin@mitra-auto.fi`  
**New Password**: `Kangaroo1234!`

---

## 🚀 Method 1: Via Supabase Dashboard (Recommended)

### Step 1: Access Supabase Dashboard
1. Go to https://supabase.com
2. Click "Sign in"
3. Login to your account
4. Select your Mitra Auto project

### Step 2: Navigate to Authentication
1. In the left sidebar, click **"Authentication"**
2. Click **"Users"** tab
3. You should see a list of users

### Step 3: Find or Create Admin User

#### Option A: If admin@mitra-auto.fi EXISTS
1. Search for `admin@mitra-auto.fi` in the user list
2. Click on the user row to open details
3. Click **"Reset Password"** or **"Edit User"**
4. In the password field, enter: `Kangaroo1234!`
5. Click **"Update User"** or **"Save"**
6. ✅ Done! Password is reset

#### Option B: If admin@mitra-auto.fi DOES NOT EXIST
1. Click **"Add User"** button (top right)
2. Fill in the form:
   - **Email**: `admin@mitra-auto.fi`
   - **Password**: `Kangaroo1234!`
   - **Auto Confirm User**: ✅ Check this box (important!)
3. Click **"Create User"**
4. ✅ Done! Admin user created

### Step 4: Verify
1. User should appear in the list
2. Email should be: `admin@mitra-auto.fi`
3. Email confirmed: ✅ Yes
4. Last sign in: Will show after first login

---

## 🔧 Method 2: Via SQL Editor (Alternative)

If you prefer using SQL:

### Step 1: Access SQL Editor
1. In Supabase Dashboard, click **"SQL Editor"**
2. Click **"New Query"**

### Step 2: Run Password Reset Query

#### If User Exists (Reset Password):
```sql
-- Update password for existing admin user
UPDATE auth.users
SET 
  encrypted_password = crypt('Kangaroo1234!', gen_salt('bf')),
  updated_at = NOW()
WHERE email = 'admin@mitra-auto.fi';

-- Verify the update
SELECT email, created_at, updated_at, email_confirmed_at
FROM auth.users
WHERE email = 'admin@mitra-auto.fi';
```

#### If User Doesn't Exist (Create New):
```sql
-- Insert new admin user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@mitra-auto.fi',
  crypt('Kangaroo1234!', gen_salt('bf')),
  NOW(), -- Confirm email immediately
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Verify
SELECT email, created_at, email_confirmed_at
FROM auth.users
WHERE email = 'admin@mitra-auto.fi';
```

### Step 3: Run the Query
1. Click **"Run"** (or press Cmd/Ctrl + Enter)
2. Check the results panel
3. Should show success message

---

## 🧪 Method 3: Via Supabase CLI (Advanced)

If you have Supabase CLI installed:

### Step 1: Login to Supabase
```bash
supabase login
```

### Step 2: Link Project
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### Step 3: Reset Password via SQL
```bash
supabase db query "
UPDATE auth.users
SET encrypted_password = crypt('Kangaroo1234!', gen_salt('bf'))
WHERE email = 'admin@mitra-auto.fi';
"
```

---

## ✅ Verification Steps

### Test the New Password

1. **Go to your website**
2. **Click Login button**
3. **Enter credentials**:
   - Email: `admin@mitra-auto.fi`
   - Password: `Kangaroo1234!`
4. **Click Login**
5. **Expected result**: 
   - ✅ Login successful
   - ✅ Redirects to `/admin/schedule`
   - ✅ Admin panel opens

### If Login Fails

**Check these:**
- [ ] Email is exactly: `admin@mitra-auto.fi` (no spaces)
- [ ] Password is exactly: `Kangaroo1234!` (case-sensitive)
- [ ] Email is confirmed in Supabase
- [ ] User exists in auth.users table
- [ ] Browser console for errors (F12)

---

## 🔐 Password Requirements

Your new password `Kangaroo1234!` meets all requirements:

✅ **Length**: 12 characters (min 8)  
✅ **Uppercase**: K (at least 1)  
✅ **Lowercase**: angaroo (at least 1)  
✅ **Number**: 1234 (at least 1)  
✅ **Special**: ! (at least 1)  
✅ **Strong**: Good entropy

---

## 🚨 Common Issues & Solutions

### Issue 1: "User not found"
**Solution**: Create new user (see Method 1, Option B)

### Issue 2: "Invalid login credentials"
**Problem**: Password doesn't match  
**Solution**: 
- Double-check password: `Kangaroo1234!`
- Try resetting again
- Check for typos

### Issue 3: "Email not confirmed"
**Problem**: Email confirmation required  
**Solution**: In Supabase Dashboard
```
1. Go to Authentication > Users
2. Find admin@mitra-auto.fi
3. Click on user
4. Toggle "Email Confirmed" to ON
5. Save
```

### Issue 4: Password reset doesn't work
**Problem**: Cached credentials  
**Solution**:
```
1. Clear browser cache
2. Use incognito/private window
3. Try different browser
4. Wait 1-2 minutes for Supabase to sync
```

---

## 📊 Quick Checklist

Before testing login:

- [ ] Supabase Dashboard opened
- [ ] Authentication > Users accessed
- [ ] User admin@mitra-auto.fi exists
- [ ] Password set to: `Kangaroo1234!`
- [ ] Email confirmed: YES
- [ ] Role: authenticated
- [ ] Browser cache cleared

After password reset:

- [ ] Tested login on website
- [ ] Login successful
- [ ] Redirected to admin panel
- [ ] Can access all admin features
- [ ] No errors in console

---

## 🎯 Expected Behavior After Reset

### Login Flow:
```
1. User goes to website
   ↓
2. Clicks Login button
   ↓
3. Enters:
   - Email: admin@mitra-auto.fi
   - Password: Kangaroo1234!
   ↓
4. Clicks Login
   ↓
5. System checks Supabase auth
   ↓
6. ✅ Credentials valid
   ↓
7. System detects admin email
   ↓
8. Redirects to /admin/schedule
   ↓
9. Admin panel opens
```

### What You'll See:
```
✅ No error messages
✅ Login modal closes
✅ URL changes to /admin/schedule
✅ Admin schedule page appears
✅ Logout button visible
✅ Can create/edit bookings
```

---

## 🔄 Alternative: Password Reset Email (Future)

For production, you might want to use Supabase's built-in password reset:

### Setup (in Supabase Dashboard):
1. Go to **Authentication** > **Email Templates**
2. Enable **"Reset Password"** template
3. Configure your email provider (SMTP)

### Usage:
```typescript
// In your app (future feature)
const { data, error } = await supabase.auth.resetPasswordForEmail(
  'admin@mitra-auto.fi',
  {
    redirectTo: 'https://your-site.com/reset-password',
  }
)
```

**Note**: This requires email server setup, so for now, use the manual methods above.

---

## 📝 Record Keeping

**Date**: November 18, 2025  
**Action**: Admin password reset  
**Email**: admin@mitra-auto.fi  
**New Password**: Kangaroo1234!  
**Method Used**: ________________  
**Completed By**: ________________  
**Verified**: ☐ Yes ☐ No  
**Notes**: _______________________

---

## 🎉 Success Indicators

You'll know the reset worked when:

1. ✅ **Login works** - No error messages
2. ✅ **Redirect happens** - Goes to /admin/schedule
3. ✅ **Admin panel loads** - Calendar visible
4. ✅ **Session persists** - Still logged in after refresh
5. ✅ **Logout works** - Can logout and login again

---

## 🔒 Security Notes

### Keep This Password Secure:
- ✅ Don't share via unencrypted channels
- ✅ Don't save in browser (use password manager)
- ✅ Don't commit to version control
- ✅ Consider changing after testing

### Future Recommendations:
- Set up 2FA (Two-Factor Authentication)
- Use password manager
- Rotate passwords regularly
- Monitor login attempts
- Set up audit logging

---

## 📞 Need Help?

### If you get stuck:

**Check**:
1. Supabase project is accessible
2. You have admin permissions in Supabase
3. Auth is enabled in project
4. Email templates are configured

**Debug**:
1. Open browser console (F12)
2. Try to login
3. Check for error messages
4. Look at Network tab for API calls

**Verify in Supabase**:
```sql
-- Check if user exists
SELECT * FROM auth.users WHERE email = 'admin@mitra-auto.fi';

-- Check user metadata
SELECT email, raw_user_meta_data, email_confirmed_at 
FROM auth.users 
WHERE email = 'admin@mitra-auto.fi';
```

---

## 🚀 Quick Start (TL;DR)

**Fastest method** (2 minutes):

```
1. Open Supabase Dashboard
2. Go to Authentication > Users
3. Find admin@mitra-auto.fi (or create if doesn't exist)
4. Set password to: Kangaroo1234!
5. Ensure email is confirmed
6. Save
7. Test login on your website
8. Done! ✅
```

---

## ✅ Completion Checklist

Mark when done:

- [ ] Opened Supabase Dashboard
- [ ] Navigated to Authentication > Users
- [ ] Found or created admin@mitra-auto.fi
- [ ] Set password to Kangaroo1234!
- [ ] Confirmed email
- [ ] Saved changes
- [ ] Tested login on website
- [ ] Login successful
- [ ] Admin panel accessible
- [ ] Documented the change

**Status**: ☐ Complete ☐ In Progress ☐ Issues

---

**Last Updated**: November 18, 2025  
**Version**: 1.0  
**Status**: Ready to execute ✅
