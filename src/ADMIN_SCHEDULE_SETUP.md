# Admin Scheduling System Setup Guide

## Overview
This guide explains how to set up the Admin Scheduling CMS for Mitra Auto.

## Database Tables Required

You need to create two tables in your Supabase database:

### 1. Bookings Table
This table already exists from the booking system. Ensure it has these columns:
- `id` (uuid, primary key)
- `license_plate` (text)
- `booking_date` (date)
- `booking_time` (text) - Format: "HH:MM" (e.g., "09:00", "14:30")
- `created_at` (timestamp)
- Additional fields for customer info and service details

### 2. Blocked Slots Table (NEW)
Create this table for admin-blocked time slots:

```sql
-- Create blocked_slots table
CREATE TABLE IF NOT EXISTS blocked_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Add indexes for better performance
CREATE INDEX idx_blocked_slots_date ON blocked_slots(date);
CREATE INDEX idx_blocked_slots_time_range ON blocked_slots(date, start_time, end_time);

-- Enable Row Level Security (RLS)
ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage blocked slots
-- Note: You'll need to implement your own admin role system
CREATE POLICY "Allow authenticated users to view blocked slots"
  ON blocked_slots
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert blocked slots"
  ON blocked_slots
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete blocked slots"
  ON blocked_slots
  FOR DELETE
  TO authenticated
  USING (true);
```

## Features

### Business Hours
- **Monday - Friday**: 09:00 - 18:00
- **Saturday**: 10:00 - 17:00
- **Sunday**: Closed

### Time Slots
- Each slot is **30 minutes**
- Multiple bookings can exist per slot
- Slots are only unavailable when blocked by admin

### Admin Capabilities
1. **View Schedule**: See all bookings and blocked slots for any day
2. **Block Slots**: Block individual slots or from a slot until end of day
3. **Unblock Slots**: Remove blocking from any slot
4. **View Booking Details**: See license plates and booking times
5. **Add Block Reasons**: Optional reason text for blocked slots

## Accessing the Admin Panel

Navigate to: `/admin/schedule`

Example: `https://your-domain.com/admin/schedule`

## Usage

### Viewing Schedule
1. Use the calendar on the left to select a date
2. Quick filters: Today, Tomorrow
3. View total bookings and blocked slots at the top

### Blocking a Slot
1. Click on any available slot
2. Enter an optional reason
3. Choose:
   - **Block This Slot**: Blocks only the 30-minute slot
   - **Block Until End of Day**: Blocks from this slot until closing time

### Unblocking a Slot
1. Click on a blocked slot
2. Click "Unblock Slot" button

### Viewing Bookings
1. Click on any booked slot
2. View all license plates and booking times
3. See when each booking was created

## Design
- Clean, minimal interface
- Mitra Auto orange (#FF6B35) accent color
- Dark/Light theme support
- Desktop-first design

## Future Enhancements (v0.2+)
- Admin authentication/authorization
- Recurring block patterns
- Export schedule to PDF/Excel
- Booking management (cancel, reschedule)
- Email notifications
- Multi-location support
- Staff assignment
