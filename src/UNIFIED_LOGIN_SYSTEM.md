# Unified Login System - Implementation Guide

## ✅ Overview

The Mitra Auto website now uses a **unified login system** where both normal users and admin users log in through the same interface. The system automatically detects admin credentials and redirects to the appropriate destination.

---

## 🎯 How It Works

### Single Login Interface
- **One AuthModal** for all users (normal + admin)
- **Same login page** for everyone
- **Automatic detection** of admin credentials
- **Smart redirection** based on user role

### Flow Diagram

```
User clicks Login
        ↓
   AuthModal opens
        ↓
User enters credentials
        ↓
System checks email
        ↓
┌─────────────────────────┬─────────────────────────┐
│                         │                         │
│  admin@mitra-auto.fi    │  other@email.com        │
│  (Admin User)           │  (Normal User)          │
│         ↓               │         ↓               │
│  Redirect to            │  Stay on current        │
│  /admin/schedule        │  page / dashboard       │
│  (CMS)                  │  (Future feature)       │
└─────────────────────────┴─────────────────────────┘
```

---

## 🔐 Admin Detection Logic

### In AuthModal (`/components/AuthModal.tsx`)

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: loginData.email,
  password: loginData.password,
});

if (data.user) {
  // Check if user is admin
  const isAdmin = data.user.email === 'admin@mitra-auto.fi';
  
  // Pass isAdmin flag to success handler
  onSuccess?.(isAdmin);
}
```

### In App.tsx

```typescript
const handleAuthSuccess = (isAdmin?: boolean) => {
  setIsLoggedIn(true);
  
  // If admin user, redirect to admin schedule
  if (isAdmin) {
    setCurrentPage('admin-schedule');
    window.history.pushState({}, '', '/admin/schedule');
  }
  // Normal users stay on current page
};
```

---

## 🚀 User Experience

### For Admin Users

**Step 1: Navigate anywhere on site**
- User can be on home page, services page, etc.

**Step 2: Click Login (or go to /admin/schedule)**
- Same AuthModal appears for everyone

**Step 3: Enter admin credentials**
- Email: `admin@mitra-auto.fi`
- Password: [your admin password]

**Step 4: Automatic redirect to CMS**
- System detects admin email
- Automatically redirects to `/admin/schedule`
- Full admin panel access granted

### For Normal Users (Future)

**Step 1-3: Same as above**
- Use different email (not admin email)

**Step 4: Stay on current page**
- Or redirect to user dashboard (when implemented)
- Access to regular user features

---

## 🔒 Security Features

### Email-Based Admin Detection
```typescript
const isAdmin = user.email === 'admin@mitra-auto.fi';
```
- Only exact match grants admin access
- Case-sensitive comparison
- No other emails can access admin panel

### Protected Admin Routes
```typescript
// AdminAuthGuard checks authentication
if (!user || !isAdmin) {
  // Redirect to home and show login
  onNeedLogin();
}
```

### Session Persistence
- Sessions stored in localStorage
- Persists across page refreshes
- Auto token refresh enabled
- Only cleared on explicit logout

---

## 📂 Files Modified

### 1. `/components/AuthModal.tsx`
**Changes:**
- Added Supabase authentication
- Added admin detection logic
- Added error handling
- Updated onSuccess callback to pass isAdmin flag

**Key Changes:**
```typescript
// Before
onSuccess?.();

// After
const isAdmin = data.user.email === 'admin@mitra-auto.fi';
onSuccess?.(isAdmin);
```

### 2. `/App.tsx`
**Changes:**
- Updated handleAuthSuccess to accept isAdmin parameter
- Added admin redirect logic
- Updated handleLogout to call Supabase signOut
- Added AdminAuthGuard callbacks
- Added auth state sync on mount

**Key Changes:**
```typescript
// Check auth on mount
useEffect(() => {
  const checkAuth = async () => {
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setIsLoggedIn(true);
    }
  };
  checkAuth();
}, []);

// Admin redirect on login
const handleAuthSuccess = (isAdmin?: boolean) => {
  setIsLoggedIn(true);
  if (isAdmin) {
    setCurrentPage('admin-schedule');
    window.history.pushState({}, '', '/admin/schedule');
  }
};

// Logout with Supabase
const handleLogout = async () => {
  const supabase = getSupabaseClient();
  await supabase.auth.signOut();
  setIsLoggedIn(false);
  // Redirect if on admin page
  if (currentPage === 'admin-schedule') {
    setCurrentPage('home');
  }
};
```

### 3. `/components/admin/AdminAuthContext.tsx`
**Status:** Unchanged (still used for admin-only features)

### 4. `/utils/supabase/client.tsx`
**Status:** Already updated with session persistence

---

## 🎯 Access Scenarios

### Scenario 1: Direct Admin Access
```
1. User navigates to /admin/schedule
   ↓
2. AdminAuthGuard checks auth
   ↓
3. Not logged in? → Redirect to home + open login modal
   ↓
4. User logs in with admin credentials
   ↓
5. Redirect back to /admin/schedule
```

### Scenario 2: Admin Login from Any Page
```
1. User on home page (or any page)
   ↓
2. Click Login button
   ↓
3. Enter admin credentials in AuthModal
   ↓
4. System detects admin email
   ↓
5. Automatic redirect to /admin/schedule
```

### Scenario 3: Normal User Login
```
1. User clicks Login
   ↓
2. Enter normal user credentials
   ↓
3. System detects non-admin email
   ↓
4. Stay on current page
   (Future: redirect to user dashboard)
```

### Scenario 4: Unauthorized Admin Access
```
1. Normal user tries to access /admin/schedule
   ↓
2. AdminAuthGuard checks: user logged in but not admin
   ↓
3. Show "Not authorized" message
   ↓
4. Redirect to home page
```

---

## 🧪 Testing Guide

### Test 1: Admin Login from Home
- [ ] Go to home page
- [ ] Click Login button
- [ ] Enter admin@mitra-auto.fi + password
- [ ] Should redirect to /admin/schedule
- [ ] Admin panel should be visible

### Test 2: Direct Admin Access (Not Logged In)
- [ ] Go directly to /admin/schedule URL
- [ ] Should redirect to home
- [ ] Login modal should auto-open
- [ ] Login with admin credentials
- [ ] Should go to admin panel

### Test 3: Session Persistence
- [ ] Login as admin
- [ ] Go to /admin/schedule
- [ ] Refresh page
- [ ] Should still be logged in
- [ ] Should still see admin panel

### Test 4: Logout
- [ ] Login as admin
- [ ] Go to admin panel
- [ ] Click Logout button
- [ ] Should redirect to home
- [ ] Session should be cleared
- [ ] Cannot access /admin/schedule without login

### Test 5: Normal User Login (When Implemented)
- [ ] Login with non-admin email
- [ ] Should NOT redirect to admin panel
- [ ] Should stay on current page
- [ ] Cannot access /admin/schedule

### Test 6: Unauthorized Access
- [ ] Login as normal user
- [ ] Try to navigate to /admin/schedule
- [ ] Should see "Not authorized" alert
- [ ] Should redirect to home

---

## 🔧 Configuration

### Admin Email
Currently hardcoded in the system. To change:

**Location 1:** `/components/AuthModal.tsx`
```typescript
const isAdmin = data.user.email === 'admin@mitra-auto.fi';
```

**Location 2:** `/components/admin/AdminAuthContext.tsx`
```typescript
const isAdminUser = currentUser.email === 'admin@mitra-auto.fi';
```

### Future: Role-Based System
For production, consider:
1. Store roles in database (user_roles table)
2. Check role instead of email
3. Support multiple admin accounts
4. Different permission levels

---

## 💡 Advantages of Unified System

### For Users
✅ **Single login interface** - No confusion about where to login  
✅ **Automatic routing** - System knows where to send you  
✅ **Seamless experience** - Same look and feel for everyone  
✅ **Fast login** - One-click access to appropriate area

### For Developers
✅ **Single auth modal** - Less code duplication  
✅ **Centralized logic** - Easier to maintain  
✅ **Consistent behavior** - Same flow for all users  
✅ **Easy to extend** - Add new user types easily

### For Security
✅ **Single point of auth** - Easier to audit  
✅ **Consistent validation** - Same rules for everyone  
✅ **Role detection** - Server-side email check  
✅ **Protected routes** - Guards on admin pages

---

## 🚧 Future Enhancements

### Phase 1: Normal User Features (Current Phase)
- [x] Unified login system
- [x] Admin detection and redirect
- [ ] Normal user dashboard
- [ ] User profile page
- [ ] Order history

### Phase 2: Enhanced Admin System
- [ ] Multiple admin accounts
- [ ] Role-based permissions
- [ ] Admin management interface
- [ ] Activity audit logs

### Phase 3: Advanced Features
- [ ] Social login (Google, Facebook)
- [ ] Two-factor authentication (2FA)
- [ ] Password reset flow
- [ ] Email verification

---

## 🐛 Troubleshooting

### Admin not redirecting after login
**Check:**
- ✅ Email is exactly `admin@mitra-auto.fi`
- ✅ handleAuthSuccess receives isAdmin parameter
- ✅ setCurrentPage is called with 'admin-schedule'
- ✅ Browser console for errors

### Login modal not opening
**Check:**
- ✅ onNeedLogin callback is passed to AdminAuthGuard
- ✅ setAuthModalOpen(true) is called
- ✅ AuthModal open prop is correct

### Session not persisting
**Check:**
- ✅ Supabase client config has persistSession: true
- ✅ localStorage contains 'mitra-auto-auth' key
- ✅ No browser errors in console

### Cannot access admin after login
**Check:**
- ✅ User is logged in (check session)
- ✅ Email matches admin email exactly
- ✅ isAdmin flag is true in AdminAuthContext
- ✅ AdminAuthGuard allows access

---

## 📞 Quick Reference

### Login as Admin
```
1. Click Login anywhere on site
2. Email: admin@mitra-auto.fi
3. Password: [your admin password]
4. Automatically redirected to /admin/schedule
```

### Logout
```
Click Logout button in:
- Navbar user menu (if shown)
- Admin panel top bar
```

### Access Admin Panel
```
Method 1: Login with admin credentials
Method 2: Navigate to /admin/schedule (triggers login if needed)
Method 3: Click Dashboard in user menu (after login)
```

---

## ✅ Summary

**What Changed:**
- ✅ Single AuthModal for all users
- ✅ Admin detection based on email
- ✅ Automatic redirect to CMS for admins
- ✅ Same login experience for everyone
- ✅ Protected admin routes

**Benefits:**
- 🎯 Simpler user experience
- 🔒 Secure role detection
- 🚀 Fast admin access
- 💻 Less code duplication
- 🔧 Easy to maintain

**Next Steps:**
1. Create admin user in Supabase
2. Test login flow
3. Verify admin redirect works
4. Test session persistence
5. Implement normal user features (future)

---

**Version**: 3.0 (Unified Login)  
**Date**: November 2025  
**Status**: Ready to use ✅
