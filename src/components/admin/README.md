# Mitra Auto - Admin CMS (Scheduling v0.1)

## Overview

This is the Admin CMS for Mitra Auto, currently focused on **Scheduling Management** (version 0.1). This is a minimal viable product that allows admins to view bookings and manage time slot availability.

## Features

### ✅ Current Features (v0.1)

#### 1. Daily Schedule View
- Visual timeline showing all 30-minute time slots
- Color-coded slot states:
  - **Gray**: Available (empty slot)
  - **Blue**: Booked (shows booking count and license plates)
  - **Red**: Blocked (admin-blocked, unavailable to customers)

#### 2. Business Hours Management
- **Weekdays (Mon-Fri)**: 09:00 - 18:00
- **Saturday**: 10:00 - 17:00
- **Sunday**: Closed (displays special message)
- Automatic adjustment based on selected day

#### 3. Booking Management
- View all bookings per time slot
- See booking details:
  - License plate number
  - Booking time
  - Creation timestamp
- Multiple bookings per slot supported
- Quick preview shows first 2 license plates

#### 4. Slot Blocking System
- **Block Single Slot**: Block one 30-minute slot
- **Block Until End of Day**: Block from selected time until closing
- Optional reason text for each block
- Instant availability update (customers can't book blocked slots)

#### 5. Slot Unblocking
- One-click unblock for any blocked slot
- Confirmation in UI
- Immediate availability restoration

#### 6. Date Navigation
- Interactive calendar picker
- Quick filters:
  - Today
  - Tomorrow
- Visual summary:
  - Total bookings for selected day
  - Total blocked slots

#### 7. Responsive Detail Panel
- Side drawer shows detailed information
- Slot header with date and time range
- Full bookings list
- Blocking controls with reason input

### 🎨 Design

- **Color Scheme**: 
  - Brand orange (#FF6B35) for accents
  - Clean dark/light theme support
  - High contrast for accessibility

- **Layout**:
  - Left sidebar: Calendar and quick filters
  - Main content: Time slot grid
  - Right panel: Slot details (slides in on demand)

- **Typography**: Clean, readable fonts with clear hierarchy

### 📊 Data Structure

#### Bookings Table
```typescript
interface Booking {
  id: string;
  license_plate: string;
  booking_date: string;  // YYYY-MM-DD
  booking_time: string;  // HH:MM (e.g., "09:00")
  created_at: string;    // ISO timestamp
}
```

#### Blocked Slots Table
```typescript
interface BlockedSlot {
  id: string;
  date: string;         // YYYY-MM-DD
  start_time: string;   // HH:MM
  end_time: string;     // HH:MM
  reason?: string;      // Optional blocking reason
  created_at: string;   // ISO timestamp
}
```

## Usage

### Accessing the Page
Navigate to: `/admin/schedule`

### Viewing Schedule
1. Page loads with today's date selected
2. See all time slots for the day
3. View booking counts and preview license plates
4. Check summary stats at top: total bookings and blocked slots

### Blocking a Slot
1. Click any available (gray) slot
2. Right panel opens
3. Enter optional reason (e.g., "Equipment maintenance")
4. Choose blocking option:
   - **Block This Slot**: Only blocks the clicked 30-min slot
   - **Block Until End of Day**: Blocks from clicked time to closing
5. Slot immediately turns red and becomes unavailable

### Viewing Booking Details
1. Click any booked (blue) slot
2. Right panel shows:
   - All license plates for that slot
   - Booking times
   - Creation timestamps
3. Use this to identify customers and manage conflicts

### Unblocking
1. Click any blocked (red) slot
2. View the blocking reason (if provided)
3. Click "Unblock Slot"
4. Slot becomes available immediately

### Changing Dates
1. Use calendar on left sidebar to select any date
2. Or use quick filters: "Today" or "Tomorrow"
3. Schedule automatically refreshes

## Technical Details

### Components

```
/components/admin/
├── AdminSchedulePage.tsx  # Main scheduling page
└── README.md             # This file
```

### State Management
- React hooks for local state
- Real-time Supabase queries
- Optimistic UI updates with error handling

### API Integration
- Supabase client for database operations
- Tables: `bookings`, `blocked_slots`
- Real-time data fetching on date change

### Error Handling
- Toast notifications for success/error states
- Loading states during data fetch
- Graceful fallbacks for missing data

## Future Roadmap

### v0.2 - Enhanced Scheduling
- [ ] Recurring block patterns (weekly/monthly)
- [ ] Bulk operations (block multiple slots at once)
- [ ] Staff assignment to bookings
- [ ] Service type filtering
- [ ] Search bookings by license plate

### v0.3 - Booking Management
- [ ] Cancel bookings from admin panel
- [ ] Reschedule bookings (drag & drop)
- [ ] Add manual bookings
- [ ] Customer contact info display
- [ ] Email/SMS notifications

### v0.4 - Advanced Features
- [ ] Multi-day view (week/month)
- [ ] Export schedule to PDF/Excel
- [ ] Statistics and analytics
- [ ] Resource allocation (bays, mechanics)
- [ ] Integration with inventory system

### v1.0 - Full CMS
- [ ] Admin authentication & authorization
- [ ] Role-based access control
- [ ] Audit logging
- [ ] Inventory management
- [ ] Customer management
- [ ] Financial reporting

## Development Notes

### Adding New Features

1. **Database Changes**: Update Supabase tables first
2. **Type Definitions**: Add TypeScript interfaces
3. **API Methods**: Add fetch/mutation functions
4. **UI Components**: Build reusable components
5. **Integration**: Wire up to main page
6. **Testing**: Test with sample data

### Testing

See `/ADMIN_SCHEDULE_TEST_DATA.md` for:
- Sample SQL inserts
- Testing scenarios
- Expected behaviors

### Database Setup

See `/ADMIN_SCHEDULE_SETUP.md` for:
- Table creation SQL
- Index setup
- RLS policies
- Initial configuration

## Known Limitations (v0.1)

1. **No Authentication**: Anyone can access `/admin/schedule` currently
2. **No Audit Trail**: No tracking of who blocked/unblocked slots
3. **Single Location**: Doesn't support multiple shop locations
4. **No Conflict Detection**: Doesn't warn about double-bookings
5. **Manual Refresh**: Doesn't auto-update when bookings change
6. **No Undo**: Can't undo block/unblock operations
7. **Desktop Only**: Not optimized for mobile use

## Security Considerations

⚠️ **IMPORTANT**: Before deploying to production:

1. **Add Authentication**: Require admin login to access page
2. **Add Authorization**: Verify user has admin role
3. **Row-Level Security**: Implement proper RLS policies in Supabase
4. **Audit Logging**: Track all block/unblock operations
5. **Input Validation**: Sanitize reason text input
6. **CSRF Protection**: Add CSRF tokens for state changes

## Support

For questions or issues:
1. Check `/ADMIN_SCHEDULE_SETUP.md` for setup help
2. Check `/ADMIN_SCHEDULE_TEST_DATA.md` for testing help
3. Review component code for implementation details
4. Check Supabase logs for database errors

## License

Part of Mitra Auto website system. All rights reserved.
