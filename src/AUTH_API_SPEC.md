# Authentication API Specification

## Overview
This document outlines the interaction between the frontend application and the Supabase backend for authentication.

The application uses a **hybrid authentication strategy**:
1.  **Sign Up**: Handled via a server-side Edge Function (`/signup`) to ensure secure user creation with specific metadata (e.g., `name`) and admin-level controls (e.g., `email_confirm: true`).
2.  **Login**: Handled directly on the client-side using the Supabase Auth SDK (`signInWithPassword`) for maximum performance and standard security flow.

---

## 1. Sign Up (Server-Side)

The frontend calls this endpoint to create a new user account.

### Endpoint Details
*   **Route**: `/make-server-bdaaf773/signup`
*   **Full URL**: `https://<PROJECT_REF>.supabase.co/functions/v1/make-server-bdaaf773/signup`
*   **Method**: `POST`
*   **Headers**:
    *   `Content-Type`: `application/json`
    *   `Authorization`: `Bearer <SUPABASE_ANON_KEY>`

### Request Body
```json
{
  "email": "user@example.com",
  "password": "securePassword123!",
  "name": "Matti Meikäläinen"
}
```

### Server Implementation Logic (Pseudo-code)
```typescript
// 1. Initialize Supabase Admin Client (Service Role)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// 2. Create User
const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  user_metadata: { name },
  email_confirm: true // Auto-confirm for this app
});

// 3. Handle Response
if (error) return errorResponse(error);
return successResponse(data);
```

### Response Formats

**Success (200 OK)**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "user_metadata": {
      "name": "Matti Meikäläinen"
    },
    "created_at": "2025-11-23T10:00:00Z"
  }
}
```

**Error (400 Bad Request / 500 Internal Server Error)**
```json
{
  "error": "User already exists"
}
```

---

## 2. Login (Client-Side)

The frontend handles login directly using the Supabase client. No custom backend endpoint is required for standard password login.

### Implementation
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: "user@example.com",
  password: "securePassword123!"
});
```

---

## 3. Admin Authentication

Admin login follows the same client-side flow as regular users but includes a logic check for the specific admin email address (`admin@mitra-auto.fi`).

### Guard Logic
1.  User logs in via `supabase.auth.signInWithPassword`.
2.  Frontend checks if `session.user.email === 'admin@mitra-auto.fi'`.
3.  If true, access is granted to CMS routes.
4.  If false, user is redirected or denied access.
