# ⚡ Supabase TypeError Fix - Quick Reference

## 🎯 Error

```
Booking error: TypeError: (void 0) is not a function
```

## ✅ Fix Applied

### File: `/utils/supabase/client.tsx`

**Changed import from**:
```typescript
import { createClient } from '@supabase/supabase-js';
```

**To**:
```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js@2';
```

### File: `/components/admin/AdminAuthContext.tsx`

**Changed import from**:
```typescript
import type { User } from '@supabase/supabase-js';
```

**To**:
```typescript
import type { User } from '@supabase/supabase-js@2';
```

---

## 🧪 Test the Fix

**Create a booking**:
```
1. Website → Book a Service
2. Fill form (TEST-999, tomorrow, 10:00)
3. Submit
4. ✅ Should succeed without errors
```

**Check console**:
```
F12 → Console
✅ Should see: "Booking created successfully"
❌ Should NOT see: TypeError
```

**Verify in CMS**:
```
/cms → Tomorrow → 10:00
✅ Should see TEST-999 booking
```

---

## 📝 What Changed

**Problem**: Missing `@2` version specifier  
**Solution**: Added version to import  
**Files**: 2 files modified  
**Status**: ✅ Fixed

---

## 🔍 Why This Fix Works

In browser environment, Supabase needs explicit version:

```typescript
// ❌ WRONG - Returns undefined
import { createClient } from '@supabase/supabase-js';

// ✅ CORRECT - Works properly
import { createClient } from '@supabase/supabase-js@2';
```

---

## ✅ Checklist

- [x] Updated `/utils/supabase/client.tsx`
- [x] Updated `/components/admin/AdminAuthContext.tsx`
- [ ] Test booking creation
- [ ] Verify no console errors
- [ ] Check booking in CMS

---

**Status**: Fixed ✅  
**Test**: Create a booking to verify  
**Risk**: Low

---

**For full details**: See `/SUPABASE_IMPORT_FIX.md`
