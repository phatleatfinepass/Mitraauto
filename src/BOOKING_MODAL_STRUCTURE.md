# Booking Modal Component Structure

## Visual Component Hierarchy

```
BookingModal (Main Container)
│
├── DialogContent (shadcn/ui)
│   │
│   ├── Gradient Blobs Background
│   │
│   ├── DialogHeader
│   │   ├── DialogTitle ("Quick Booking")
│   │   ├── Step Indicator ("Step 1 of 2" / "Step 2 of 2")
│   │   └── DialogDescription
│   │
│   ├── Progress Bar
│   │   └── Progress (0-50-100%)
│   │
│   └── Step Content (Animated Transitions)
│       │
│       ├── [Step 1] BookingStep1
│       │   │
│       │   ├── LicensePlateInput
│       │   │   ├── Label (with Car icon)
│       │   │   ├── Input (formatted uppercase)
│       │   │   └── Helper/Error text
│       │   │
│       │   ├── Date Picker
│       │   │   ├── Label (with Calendar icon)
│       │   │   ├── Popover Trigger Button
│       │   │   └── Popover Content
│       │   │       └── Calendar (shadcn/ui)
│       │   │
│       │   ├── TimeSlotGrid
│       │   │   ├── Label (with Clock icon)
│       │   │   └── Grid of TimeSlot Buttons
│       │   │       ├── Available (selectable)
│       │   │       ├── Selected (highlighted)
│       │   │       └── Disabled (unavailable)
│       │   │
│       │   ├── Error Alert (if validation fails)
│       │   │
│       │   └── Action Buttons
│       │       ├── Cancel (outline)
│       │       └── Continue (primary, disabled until valid)
│       │
│       ├── [Step 2] BookingStep2
│       │   │
│       │   ├── Desktop Layout (2 columns)
│       │   │   │
│       │   │   ├── Left Column
│       │   │   │   │
│       │   │   │   ├── ServiceCardList
│       │   │   │   │   ├── Header ("Select Service" + CMS badge)
│       │   │   │   │   └── ServiceCard (multiple)
│       │   │   │   │       ├── Service Name
│       │   │   │   │       ├── Description
│       │   │   │   │       ├── Duration (Clock icon)
│       │   │   │   │       ├── Price (Euro icon)
│       │   │   │   │       └── Checkmark (if selected)
│       │   │   │   │
│       │   │   │   └── Contact Form
│       │   │   │       ├── Name Input (required)
│       │   │   │       ├── Phone Input (required)
│       │   │   │       ├── Email Input (optional)
│       │   │   │       └── Notes Textarea (optional)
│       │   │   │
│       │   │   └── Right Column (Sticky)
│       │   │       └── BookingSummaryCard
│       │   │           ├── Header ("Booking Summary" + Edit button)
│       │   │           ├── License Plate (Car icon)
│       │   │           ├── Date (Calendar icon)
│       │   │           └── Time (Clock icon)
│       │   │
│       │   ├── Mobile Layout (single column)
│       │   │   └── Same components stacked vertically
│       │   │
│       │   ├── Error Alert (if validation fails)
│       │   │
│       │   └── Action Buttons
│       │       ├── Back (outline)
│       │       └── Confirm Booking (primary, disabled until valid)
│       │
│       └── [Success] BookingSuccess
│           │
│           ├── Success Icon (green checkmark)
│           │
│           ├── Success Message
│           │   ├── Title ("Booking Confirmed!")
│           │   └── Subtitle
│           │
│           ├── Booking Details Card
│           │   ├── Service
│           │   ├── License Plate
│           │   ├── Date
│           │   ├── Time
│           │   ├── Separator
│           │   ├── Name
│           │   ├── Phone
│           │   └── Email (if provided)
│           │
│           ├── Confirmation Notice (blue info box)
│           │
│           └── Action Buttons
│               ├── Add to Calendar (outline)
│               └── Done (primary)
```

## State Flow Diagram

```
┌─────────────────────────────────────────────────┐
│           App.tsx (HomePage)                    │
│                                                 │
│  [bookingModalOpen: boolean]                   │
│  [setBookingModalOpen: (open: boolean) => void]│
│                                                 │
│  Hero Button: onClick={() =>                   │
│    setBookingModalOpen(true)                   │
│                                                 │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│         BookingModal.tsx                        │
│                                                 │
│  State:                                         │
│  • currentStep: 'step1' | 'step2' | 'success'  │
│  • licensePlate: string                        │
│  • date: Date | undefined                      │
│  • selectedTimeSlot: string | null             │
│  • selectedServiceId: string | null            │
│  • contactInfo: {name, phone, email, notes}    │
│                                                 │
└──────┬──────────────┬──────────────┬────────────┘
       │              │              │
       ▼              ▼              ▼
  ┌─────────┐   ┌─────────┐   ┌──────────┐
  │ Step 1  │   │ Step 2  │   │ Success  │
  └─────────┘   └─────────┘   └──────────┘
```

## Data Flow

### Step 1 → Step 2 Transition

```
User Input (Step 1):
┌────────────────────────┐
│ licensePlate: "ABC-123"│
│ date: Date(2025-11-15) │
│ timeSlot: "14:00"      │
└────────────────────────┘
           ↓
    Validation Check
           ↓
    onContinue() called
           ↓
  setCurrentStep('step2')
           ↓
Step 2 Renders with Summary
```

### Step 2 → Success Transition

```
User Input (Step 2):
┌─────────────────────────────┐
│ serviceId: "tire-change"    │
│ contactInfo: {              │
│   name: "John Doe"          │
│   phone: "+358 40 123 4567" │
│   email: "john@example.com" │
│   notes: "..."              │
│ }                           │
└─────────────────────────────┘
           ↓
    Validation Check
           ↓
  API Call (simulated)
  POST /api/bookings/create
           ↓
    onConfirm() called
           ↓
  setCurrentStep('success')
           ↓
Success Screen Renders
```

## Component Communication

```
BookingModal
    │
    ├── manages state
    │   │
    │   ├── passes to → BookingStep1
    │   │   ├── licensePlate
    │   │   ├── date
    │   │   ├── selectedTimeSlot
    │   │   ├── onLicensePlateChange
    │   │   ├── onDateChange
    │   │   ├── onTimeSlotChange
    │   │   ├── onContinue (→ setCurrentStep)
    │   │   └── onCancel (→ closes modal)
    │   │
    │   ├── passes to → BookingStep2
    │   │   ├── licensePlate (display only)
    │   │   ├── date (display only)
    │   │   ├── timeSlot (display only)
    │   │   ├── selectedServiceId
    │   │   ├── contactInfo
    │   │   ├── onServiceChange
    │   │   ├── onContactInfoChange
    │   │   ├── onBack (→ setCurrentStep)
    │   │   ├── onEditStep1 (→ setCurrentStep)
    │   │   └── onConfirm (→ setCurrentStep)
    │   │
    │   └── passes to → BookingSuccess
    │       ├── licensePlate (display only)
    │       ├── date (display only)
    │       ├── timeSlot (display only)
    │       ├── serviceName (derived)
    │       ├── contactInfo (display only)
    │       └── onClose (→ closes modal)
    │
    └── receives from App
        ├── open: boolean
        └── onOpenChange: (open: boolean) => void
```

## Validation Chain

```
Step 1 Validation:
┌─────────────────────┐
│ License Plate       │ → Not empty & length ≥ 3
│ Date                │ → Selected & ≥ today
│ Time Slot           │ → Selected
└─────────────────────┘
          ↓
    All Valid?
          ↓
    Yes → Enable "Continue" button
    No  → Keep button disabled

Step 2 Validation:
┌─────────────────────┐
│ Service             │ → Selected
│ Name                │ → Not empty
│ Phone               │ → Valid phone format
│ Email (optional)    │ → Valid email format if provided
└─────────────────────┘
          ↓
    All Valid?
          ↓
    Yes → Enable "Confirm Booking" button
    No  → Keep button disabled
```

## Responsive Breakpoints

```
Mobile (<640px):
┌────────────────┐
│   Full Screen  │
│   Modal Sheet  │
│                │
│   [Content]    │
│   Single Col   │
│                │
│   [Sticky CTA] │
└────────────────┘

Tablet (640px-1023px):
┌──────────────────────┐
│   Modal (auto width) │
│                      │
│   [Content]          │
│   Single Column      │
│                      │
│   [Summary]          │
│   [CTAs]             │
└──────────────────────┘

Desktop (≥1024px):
┌──────────────────────────────────┐
│   Modal (720-880px)              │
│   ┌────────────────┬───────────┐ │
│   │ Services       │ Summary   │ │
│   │ Contact Form   │ (sticky)  │ │
│   │                │           │ │
│   │                │           │ │
│   ├────────────────┴───────────┤ │
│   │ [Back] [Confirm Booking]  │ │
│   └───────────────────────────┘ │
└──────────────────────────────────┘
```

## Animation Flow

```
Modal Open:
  fade-in + zoom-in (200ms)
  backdrop-blur appears

Step Transition:
  Current step: fade-out + slide-left
  Next step: fade-in + slide-right
  (300ms duration)

Button Hover:
  scale(1.02) + shadow increase
  (200ms duration)

Card Selection:
  scale(1.02) + ring appear
  checkmark fade-in
  (200ms duration)

Modal Close:
  fade-out + zoom-out (200ms)
  backdrop-blur disappears
```

---

This structure ensures:
✅ Clear component hierarchy
✅ Unidirectional data flow
✅ Separation of concerns
✅ Reusable components
✅ Type-safe props
✅ Accessible markup
✅ Responsive design
✅ Smooth animations
