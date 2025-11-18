# Admin Scheduling - Visual Interface Guide

## Page Layout Overview

```
┌────────────────────────────────────────────────────────────────────────────┐
│  TOP BAR                                                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │  Ajanvaraukset (Scheduling)          📊 12 Bookings  │  🚫 3 Blocked │ │
│  │  Thu 18 Nov 2025                                                      │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────┐  ┌──────────────────────────────────────────────────┐  │
│  │ LEFT SIDEBAR │  │ MAIN CONTENT - SCHEDULE GRID                     │  │
│  │              │  │                                                   │  │
│  │ 📅 Calendar  │  │  🕐 09:00  ┌──────────────────────────────────┐  │  │
│  │  November    │  │            │ 🔵 Booked (2) ABC-123  XYZ-789  │  │  │
│  │              │  │            └──────────────────────────────────┘  │  │
│  │ Mo Tu We Th  │  │  🕐 09:30  ┌──────────────────────────────────┐  │  │
│  │          18  │  │            │ Available                        │  │  │
│  │ 19 20 21 22  │  │            └──────────────────────────────────┘  │  │
│  │              │  │  🕐 10:00  ┌──────────────────────────────────┐  │  │
│  │              │  │            │ 🔵 Booked (1) DEF-456            │  │  │
│  │ Quick Filter │  │            └──────────────────────────────────┘  │  │
│  │ 📅 Today     │  │  🕐 10:30  ┌──────────────────────────────────┐  │  │
│  │ 📅 Tomorrow  │  │            │ Available                        │  │  │
│  │              │  │            └──────────────────────────────────┘  │  │
│  │              │  │  🕐 11:00  ┌──────────────────────────────────┐  │  │
│  │              │  │            │ Available                        │  │  │
│  │              │  │            └──────────────────────────────────┘  │  │
│  │              │  │  🕐 11:30  ┌──────────────────────────────────┐  │  │
│  │              │  │            │ Available                        │  │  │
│  │              │  │            └──────────────────────────────────┘  │  │
│  │              │  │  🕐 12:00  ┌──────────────────────────────────┐  │  │
│  │              │  │            │ 🔴 Blocked - Lunch break         │  │  │
│  │              │  │            └──────────────────────────────────┘  │  │
│  │              │  │  🕐 12:30  ┌──────────────────────────────────┐  │  │
│  │              │  │            │ 🔴 Blocked - Lunch break         │  │  │
│  │              │  │            └──────────────────────────────────┘  │  │
│  │              │  │  ... (more time slots)                        │  │  │
│  └──────────────┘  └──────────────────────────────────────────────┘  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

## Slot States Visual Examples

### 1. Empty/Available Slot (Gray)
```
┌────────────────────────────────────────┐
│ 🕐 10:30  Available                    │
│           (hover: "Block this slot")   │
└────────────────────────────────────────┘
```

### 2. Booked Slot (Blue)
```
┌────────────────────────────────────────┐
│ 🕐 09:00  🔵 Booked (3)                │
│           ABC-123  XYZ-789  +1         │
└────────────────────────────────────────┘
```

### 3. Blocked Slot (Red)
```
┌────────────────────────────────────────┐
│ 🕐 12:00  🔴 Blocked                   │
│           Lunch break                  │
└────────────────────────────────────────┘
```

## Detail Drawer (Right Panel)

When you click on any slot, a drawer slides in from the right:

```
┌──────────────────────────────────────────────┐
│  Slot Details                          [×]   │
│  Thu 18 Nov 2025 — 09:00               │
├──────────────────────────────────────────────┤
│                                              │
│  Bookings (2)                                │
│  ┌────────────────────────────────────────┐  │
│  │ ABC-123                         09:00  │  │
│  │ Created: 18 Nov 2025, 07:30           │  │
│  └────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────┐  │
│  │ XYZ-789                         09:00  │  │
│  │ Created: 18 Nov 2025, 08:15           │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ─────────────────────────────────────────   │
│                                              │
│  Blocking Controls                           │
│  ┌────────────────────────────────────────┐  │
│  │ Reason (optional)                      │  │
│  │ ┌────────────────────────────────────┐ │  │
│  │ │ e.g. Maintenance                   │ │  │
│  │ └────────────────────────────────────┘ │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌──────────────────┐ ┌──────────────────┐  │
│  │ 🔒 Block Slot    │ │ Block Until EOD  │  │
│  └──────────────────┘ └──────────────────┘  │
│                                              │
└──────────────────────────────────────────────┘
```

## Blocked Slot Detail Drawer

When clicking a blocked slot:

```
┌──────────────────────────────────────────────┐
│  Slot Details                          [×]   │
│  Thu 18 Nov 2025 — 12:00               │
├──────────────────────────────────────────────┤
│                                              │
│  Bookings (0)                                │
│  No bookings                                 │
│                                              │
│  ─────────────────────────────────────────   │
│                                              │
│  Blocking Controls                           │
│  ┌────────────────────────────────────────┐  │
│  │ 🔴 Lunch break                         │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │       🔓 Unblock Slot                  │  │
│  └────────────────────────────────────────┘  │
│                                              │
└──────────────────────────────────────────────┘
```

## Top Bar Summary Stats

```
┌──────────────────────────────────────────────────────────────┐
│  Ajanvaraukset (Scheduling)                                  │
│  Thu 18 Nov 2025                                             │
│                                                              │
│  ┌────────────┐  │  ┌────────────┐                          │
│  │     12     │  │  │      3     │                          │
│  │ Total      │  │  │ Blocked    │                          │
│  │ Bookings   │  │  │ Slots      │                          │
│  └────────────┘  │  └────────────┘                          │
└──────────────────────────────────────────────────────────────┘
```

## Calendar Sidebar

```
┌──────────────────────┐
│ Select Date          │
│                      │
│   November 2025      │
│ Mo Tu We Th Fr Sa Su │
│                 1  2 │
│  3  4  5  6  7  8  9 │
│ 10 11 12 13 14 15 16 │
│ 17 [18]19 20 21 22 23│ ← 18 is selected
│ 24 25 26 27 28 29 30 │
│                      │
│ ──────────────────── │
│                      │
│ 📅 Today             │
│ 📅 Tomorrow          │
│                      │
└──────────────────────┘
```

## Sunday Closed View

When Sunday is selected:

```
┌────────────────────────────────────────────────────┐
│                                                    │
│                     ⚠️                             │
│                                                    │
│                   Closed                           │
│                                                    │
│             Closed on Sundays                      │
│                                                    │
│                                                    │
└────────────────────────────────────────────────────┘
```

## Color Scheme

### Light Theme
- **Background**: White (#FFFFFF)
- **Card Background**: Gray 50 (#F9FAFB)
- **Text Primary**: Gray 900 (#111827)
- **Text Secondary**: Gray 600 (#4B5563)
- **Available Slot**: Gray 50 (#F9FAFB)
- **Booked Slot**: Blue 50 (#EFF6FF) with Blue 600 badge
- **Blocked Slot**: Red 50 (#FEF2F2) with Red 600 badge
- **Accent (CTA)**: Orange (#FF6B35)

### Dark Theme
- **Background**: Dark (#11141A)
- **Card Background**: Dark Gray (#1C1C1E)
- **Text Primary**: White (#FFFFFF)
- **Text Secondary**: Gray 400 (#9CA3AF)
- **Available Slot**: Gray (#252525)
- **Booked Slot**: Blue 950/20 with Blue 600 badge
- **Blocked Slot**: Red 950/20 with Red 600 badge
- **Accent (CTA)**: Orange (#FF6B35)

## Interaction Flow Examples

### Flow 1: Block a Time Slot
```
1. User sees schedule
   ↓
2. Clicks empty slot (e.g., 15:00)
   ↓
3. Drawer slides in from right
   ↓
4. User types reason: "Equipment maintenance"
   ↓
5. Clicks "Block This Slot"
   ↓
6. Toast: "Slot blocked successfully"
   ↓
7. Slot turns red on schedule
   ↓
8. Drawer closes
```

### Flow 2: View Booking Details
```
1. User sees blue (booked) slot
   ↓
2. Clicks on slot
   ↓
3. Drawer shows all bookings
   ↓
4. User reads license plates
   ↓
5. Clicks outside drawer or [×] to close
```

### Flow 3: Block Until End of Day
```
1. User clicks slot at 16:00
   ↓
2. Enters reason: "Closing early"
   ↓
3. Clicks "Block Until End of Day"
   ↓
4. All slots 16:00-18:00 turn red
   ↓
5. Success notification
```

## Mobile Considerations (Future)

Currently desktop-first. For mobile version (future):
- Stack calendar above schedule
- Full-width time slots
- Bottom sheet instead of side drawer
- Simplified stats bar
- Touch-friendly tap targets

## Keyboard Navigation (Future Enhancement)

Planned shortcuts:
- `←` `→` : Navigate between days
- `T` : Jump to Today
- `Esc` : Close drawer
- `Tab` : Navigate between slots
- `Enter` : Open slot details

## Print View (Future Enhancement)

Planned feature for v0.2+:
- Clean print stylesheet
- One page per day
- Remove interactive elements
- Include all booking details
- Header with business name and date

---

**Note**: This is a visual guide. The actual implementation uses React components with Tailwind CSS for styling. All interactions are smooth with proper loading states and animations.
