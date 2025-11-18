# 🔑 Admin Password Reset - Quick Guide

## ⚡ Quick Steps (2 minutes)

### New Admin Credentials
```
Email: admin@mitra-auto.fi
Password: Kangaroo1234!
```

---

## 🎯 Method: Supabase Dashboard

### Step 1: Open Supabase
```
1. Go to https://supabase.com
2. Login
3. Select your Mitra Auto project
```

### Step 2: Go to Users
```
1. Left sidebar → "Authentication"
2. Click "Users" tab
```

### Step 3: Reset Password

**If user EXISTS**:
```
1. Search for: admin@mitra-auto.fi
2. Click on the user
3. Click "Edit" or "Reset Password"
4. Enter password: Kangaroo1234!
5. Save
```

**If user DOESN'T exist**:
```
1. Click "Add User" button
2. Email: admin@mitra-auto.fi
3. Password: Kangaroo1234!
4. ✅ Check "Auto Confirm User"
5. Click "Create User"
```

### Step 4: Verify
```
1. Go to your website
2. Click Login
3. Email: admin@mitra-auto.fi
4. Password: Kangaroo1234!
5. Should redirect to /admin/schedule
```

---

## ✅ Success = Login Works!

**You're done when**:
- ✅ Login successful
- ✅ Redirects to admin panel
- ✅ No error messages

---

## 🐛 If Login Fails

**Check**:
- Email is exactly: `admin@mitra-auto.fi`
- Password is exactly: `Kangaroo1234!` (case-sensitive)
- Email is confirmed in Supabase
- Clear browser cache

**In Supabase**:
```
Authentication → Users → admin@mitra-auto.fi
- Email Confirmed: Must be ✅ ON
- Role: authenticated
```

---

## 📊 Visual Steps

```
Supabase Dashboard
    ↓
Authentication (sidebar)
    ↓
Users (tab)
    ↓
Find/Create admin@mitra-auto.fi
    ↓
Set password: Kangaroo1234!
    ↓
✅ Email Confirmed: ON
    ↓
Save
    ↓
Test login on website
```

---

## 🔐 Password Details

**Password**: `Kangaroo1234!`

**Contains**:
- ✅ Uppercase: K
- ✅ Lowercase: angaroo
- ✅ Numbers: 1234
- ✅ Special: !
- ✅ Length: 12 chars

---

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| "User not found" | Create new user in Supabase |
| "Invalid credentials" | Check password exactly: `Kangaroo1234!` |
| "Email not confirmed" | In Supabase: Toggle email confirmed ON |
| Still doesn't work | Clear browser cache, try incognito |

---

## 📝 Quick Test

```bash
# After resetting, test:
1. Go to your site
2. Click Login
3. Enter admin@mitra-auto.fi + Kangaroo1234!
4. Should go to /admin/schedule
5. ✅ Done!
```

---

## 🎯 Checklist

- [ ] Opened Supabase Dashboard
- [ ] Went to Authentication > Users
- [ ] Set password: Kangaroo1234!
- [ ] Email confirmed: ON
- [ ] Saved
- [ ] Tested login
- [ ] ✅ Login works!

---

**That's it!** Simple 2-minute process. 🚀

For detailed instructions, see: `/RESET_ADMIN_PASSWORD.md`
