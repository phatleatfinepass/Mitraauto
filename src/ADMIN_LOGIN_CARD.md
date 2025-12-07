# 🎫 Admin Login - Quick Reference Card

```
╔════════════════════════════════════════════════╗
║                                                ║
║         MITRA AUTO - ADMIN ACCESS              ║
║                                                ║
╠════════════════════════════════════════════════╣
║                                                ║
║  📧 EMAIL                                      ║
║  admin@mitra-auto.fi                           ║
║                                                ║
║  🔑 PASSWORD                                   ║
║  Kangaroo1234!                                 ║
║                                                ║
║  🌐 ACCESS                                     ║
║  Click "Login" → Auto-redirect to CMS          ║
║                                                ║
╠════════════════════════════════════════════════╣
║                                                ║
║  ⚡ QUICK SETUP                                ║
║                                                ║
║  1. Supabase Dashboard                         ║
║  2. Authentication → Users                     ║
║  3. Add/Edit: admin@mitra-auto.fi              ║
║  4. Password: Kangaroo1234!                    ║
║  5. ✅ Auto Confirm Email                      ║
║  6. Save                                       ║
║                                                ║
╠════════════════════════════════════════════════╣
║                                                ║
║  ✅ VERIFICATION                               ║
║                                                ║
║  → Go to website                               ║
║  → Click Login                                 ║
║  → Enter credentials                           ║
║  → Should redirect to /admin/schedule          ║
║                                                ║
╠════════════════════════════════════════════════╣
║                                                ║
║  🐛 TROUBLESHOOTING                            ║
║                                                ║
║  ❌ Login fails?                               ║
║     • Check email is confirmed in Supabase     ║
║     • Verify password: Kangaroo1234!           ║
║     • Clear browser cache                      ║
║                                                ║
║  ❌ Doesn't redirect to admin?                 ║
║     • Email must be exactly:                   ║
║       admin@mitra-auto.fi                      ║
║                                                ║
╠════════════════════════════════════════════════╣
║                                                ║
║  📚 FULL GUIDES                                ║
║                                                ║
║  • /ADMIN_PASSWORD_RESET_QUICK.md              ║
║  • /RESET_ADMIN_PASSWORD.md                    ║
║  • /ADMIN_CREDENTIALS_SUMMARY.md               ║
║  • /START_HERE.md                              ║
║                                                ║
╠════════════════════════════════════════════════╣
║                                                ║
║  🔒 SECURITY NOTES                             ║
║                                                ║
║  • Case-sensitive password                     ║
║  • Keep credentials secure                     ║
║  • Don't commit to git                         ║
║  • Use password manager                        ║
║  • Change for production                       ║
║                                                ║
╠════════════════════════════════════════════════╣
║                                                ║
║  📊 WHAT YOU GET                               ║
║                                                ║
║  ✅ Full admin panel access                    ║
║  ✅ Booking management                         ║
║  ✅ Calendar view                              ║
║  ✅ Customer details                           ║
║  ✅ Status management                          ║
║  ✅ Persistent session                         ║
║                                                ║
╚════════════════════════════════════════════════╝
```

---

## 🎯 Copy-Paste Ready

### For Supabase User Creation
```
Email: admin@mitra-auto.fi
Password: Kangaroo1234!
Auto Confirm: YES
```

### For Login Testing
```
Email: admin@mitra-auto.fi
Password: Kangaroo1234!
```

### For SQL Query (if needed)
```sql
-- Check if user exists
SELECT email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'admin@mitra-auto.fi';
```

---

## ⚡ 30-Second Setup

```
1. Open Supabase
2. Auth → Users → Add User
3. admin@mitra-auto.fi / Kangaroo1234!
4. ✅ Auto Confirm
5. Create
6. Test login on site
7. Done! ✅
```

---

## 📱 Mobile-Friendly Login

Works on all devices:
- 📱 Mobile phones
- 📱 Tablets  
- 💻 Desktop
- 🖥️ Large screens

Same credentials, same experience!

---

## 🔄 Quick Actions

### Reset Password
```
Supabase → Auth → Users → admin@mitra-auto.fi
→ Edit → Password: Kangaroo1234! → Save
```

### Confirm Email
```
Supabase → Auth → Users → admin@mitra-auto.fi
→ Toggle "Email Confirmed" ON → Save
```

### Test Login
```
Website → Login → Credentials → Should go to /admin/schedule
```

---

## 🎉 Status

**Setup**: ✅ Ready  
**Testing**: ✅ Ready  
**Production**: ⚠️ Change password first  
**Documentation**: ✅ Complete  

---

**Print this card or save it for quick reference!** 📌

Last Updated: November 18, 2025
