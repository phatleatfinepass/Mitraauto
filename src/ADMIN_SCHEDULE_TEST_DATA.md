# Admin Schedule - Test Data

## Sample SQL to Insert Test Data

### Sample Bookings
```sql
-- Insert sample bookings for testing
INSERT INTO bookings (license_plate, booking_date, booking_time, created_at, customer_email, customer_first_name, customer_last_name)
VALUES 
  -- Today's bookings
  ('ABC-123', CURRENT_DATE, '09:00', NOW() - INTERVAL '2 hours', 'test1@example.com', 'Matti', 'Virtanen'),
  ('XYZ-789', CURRENT_DATE, '09:00', NOW() - INTERVAL '1 hour', 'test2@example.com', 'Liisa', 'Korhonen'),
  ('DEF-456', CURRENT_DATE, '10:30', NOW() - INTERVAL '3 hours', 'test3@example.com', 'Pekka', 'Nieminen'),
  ('GHI-789', CURRENT_DATE, '14:00', NOW() - INTERVAL '4 hours', 'test4@example.com', 'Anna', 'Mäkinen'),
  
  -- Tomorrow's bookings
  ('JKL-012', CURRENT_DATE + INTERVAL '1 day', '09:30', NOW(), 'test5@example.com', 'Jukka', 'Salminen'),
  ('MNO-345', CURRENT_DATE + INTERVAL '1 day', '11:00', NOW(), 'test6@example.com', 'Sari', 'Koskinen'),
  ('PQR-678', CURRENT_DATE + INTERVAL '1 day', '15:30', NOW(), 'test7@example.com', 'Mikko', 'Hämäläinen');
```

### Sample Blocked Slots
```sql
-- Insert sample blocked slots for testing
INSERT INTO blocked_slots (date, start_time, end_time, reason, created_at)
VALUES 
  -- Today - lunch break
  (CURRENT_DATE, '12:00', '13:00', 'Lunch break', NOW()),
  
  -- Tomorrow - maintenance
  (CURRENT_DATE + INTERVAL '1 day', '16:00', '17:00', 'Equipment maintenance', NOW()),
  
  -- Day after tomorrow - staff meeting
  (CURRENT_DATE + INTERVAL '2 days', '09:00', '10:00', 'Staff meeting', NOW());
```

## Quick Access URL

To access the admin schedule page directly, navigate to:
```
/admin/schedule
```

Or create a bookmark in your browser for quick access.

## Testing Scenarios

### Scenario 1: View Daily Schedule
1. Open `/admin/schedule`
2. Default view shows today's schedule
3. Verify you see all time slots from 09:00 to 18:00
4. Check that bookings appear with license plates
5. Check that blocked slots appear in red

### Scenario 2: Block a Time Slot
1. Click on an empty time slot (e.g., 10:00)
2. Enter a reason: "Emergency maintenance"
3. Click "Block This Slot"
4. Verify slot turns red and shows "Blocked"
5. Click the slot again to see the reason

### Scenario 3: Block Until End of Day
1. Click on an empty time slot (e.g., 15:00)
2. Enter reason: "Closed early"
3. Click "Block Until End of Day"
4. Verify all slots from 15:00 to 18:00 are blocked

### Scenario 4: Unblock a Slot
1. Click on a blocked time slot
2. Click "Unblock Slot" button
3. Verify slot returns to available state

### Scenario 5: View Booking Details
1. Click on a booked time slot
2. Verify you see all license plates
3. Check timestamps are displayed correctly

### Scenario 6: Navigate Between Days
1. Use calendar to select tomorrow
2. Verify schedule updates
3. Use "Today" quick filter to return to today
4. Use "Tomorrow" quick filter to jump ahead

### Scenario 7: Saturday Hours
1. Select a Saturday using the calendar
2. Verify hours are 10:00 - 17:00 (not 09:00-18:00)

### Scenario 8: Sunday Closed
1. Select a Sunday using the calendar
2. Verify "Closed on Sundays" message appears
3. Verify no time slots are shown

## Clean Up Test Data

```sql
-- Remove all test bookings
DELETE FROM bookings WHERE customer_email LIKE 'test%@example.com';

-- Remove all test blocked slots
DELETE FROM blocked_slots WHERE created_at > NOW() - INTERVAL '1 day';
```

## Tips for Development

1. **Direct URL**: Bookmark `/admin/schedule` for quick access
2. **Theme Toggle**: Test both dark and light themes
3. **Language Toggle**: Test in both Finnish and English
4. **Multiple Bookings**: Test slots with 3+ bookings to see the "+N" counter
5. **Long Reasons**: Test blocking with long reason text to see truncation
6. **Responsive**: Although desktop-first, test on mobile to ensure basic functionality

## Future Development Notes

For production, you should add:
- Admin authentication (only admins can access `/admin/schedule`)
- Audit logging (track who blocked/unblocked slots)
- Permission system (different admin levels)
- Session timeout
- CSRF protection
