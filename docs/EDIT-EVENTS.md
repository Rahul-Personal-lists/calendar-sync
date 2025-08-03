# Edit Events Functionality

## Overview
The calendar sync app now supports editing events from both the local database and the original calendar provider (Google Calendar, Outlook, etc.).

## How it Works

### 1. API Endpoint
- **Route**: `PUT /api/events`
- **Authentication**: Requires valid session
- **Request Body**: `{ eventId: string, ...updateData }`
- **Response**: Success/error status with provider update details

### 2. Provider Integration
The update process works in two steps:

1. **Provider Update**: Attempts to update the event in the original calendar provider
   - Google Calendar: Uses Google Calendar API
   - Outlook: Uses Microsoft Graph API
   - Other providers: Can be extended as needed

2. **Database Update**: Updates the event in our local database

### 3. Error Handling
- If provider update fails, the event is still updated in the database
- User receives feedback about which operations succeeded/failed
- Detailed error messages for debugging

## UI Components

### EventEditModal Component
- Pre-populated form with current event data
- Editable fields: title, date, time, location, description
- All-day event toggle
- Calendar provider selection
- Loading states during submission

### CalendarView Component
- Edit button (✏️) appears on hover for each event
- Edit button alongside delete button
- Visual feedback for edit operations

### Dashboard Integration
- Edit mutation with React Query
- Toast notifications for success/error states
- Loading indicators in header

## Usage

### For Users
1. Navigate to the calendar view
2. Select a date with events
3. Hover over an event to see the edit button (✏️)
4. Click the edit button to open the edit modal
5. Modify the event details (title, time, location, description)
6. Click "Save Changes" to update the event

### For Developers
```typescript
// Update an event
const response = await fetch('/api/events', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    eventId: 'event-id-here',
    title: 'Updated Title',
    start_time: '2024-01-01T10:00:00Z',
    end_time: '2024-01-01T11:00:00Z',
    location: 'New Location',
    description: 'Updated description'
  })
});

const result = await response.json();
// result.providerUpdateSuccess - whether provider update succeeded
// result.providerError - error message if provider update failed
```

## Supported Fields
- **title**: Event title
- **start_time**: Event start time (ISO 8601)
- **end_time**: Event end time (ISO 8601)
- **location**: Event location
- **description**: Event description
- **is_all_day**: Whether event is all-day

## Security Features
- User authentication required for all update operations
- Row-level security ensures users can only edit their own events
- Provider-specific event IDs required for provider updates

## Error Scenarios
1. **Provider Update Fails**: Event is updated in database but not in provider
2. **Database Update Fails**: No changes are made
3. **Invalid Data**: Form validation prevents submission
4. **Network Issues**: Retry mechanism and user feedback

## Future Enhancements
- Batch editing for multiple events
- Recurring event support
- Attendee management
- Event templates 