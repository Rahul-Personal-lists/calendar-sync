# Delete Events Functionality

## Overview
The calendar sync app now supports deleting events from both the local database and the original calendar provider (Google Calendar, Outlook, etc.).

## How it Works

### 1. API Endpoint
- **Route**: `DELETE /api/events`
- **Authentication**: Requires valid session
- **Request Body**: `{ eventId: string }`
- **Response**: Success/error status with provider deletion details

### 2. Provider Integration
The delete process works in two steps:

1. **Provider Deletion**: Attempts to delete the event from the original calendar provider
   - Google Calendar: Uses Google Calendar API
   - Outlook: Uses Microsoft Graph API
   - Other providers: Can be extended as needed

2. **Database Deletion**: Removes the event from our local database

### 3. Error Handling
- If provider deletion fails, the event is still deleted from the database
- User receives feedback about which operations succeeded/failed
- Detailed error messages for debugging

## UI Components

### CalendarView Component
- Delete button appears on hover for each event
- Confirmation dialog prevents accidental deletions
- Loading states during deletion process
- Visual feedback for delete operations

### Dashboard Integration
- Delete mutation with React Query
- Toast notifications for success/error states
- Loading indicators in header

## Usage

### For Users
1. Navigate to the calendar view
2. Select a date with events
3. Hover over an event to see the delete button (×)
4. Click the delete button to show confirmation
5. Confirm deletion to remove the event

### For Developers
```typescript
// Delete an event
const response = await fetch('/api/events', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ eventId: 'event-id-here' })
});

const result = await response.json();
// result.providerDeleteSuccess - whether provider deletion succeeded
// result.providerError - error message if provider deletion failed
```

## Security Features
- User authentication required for all delete operations
- Row-level security ensures users can only delete their own events
- Provider-specific access token validation
- Audit trail through database logs

## Provider-Specific Notes

### Google Calendar
- Requires valid access token
- Uses Google Calendar API v3
- Handles both single events and recurring events

### Outlook/Microsoft Graph
- Requires valid access token
- Uses Microsoft Graph API
- Supports calendar events and meetings

## Future Enhancements
- [ ] Support for recurring event deletion
- [ ] Bulk delete functionality
- [ ] Undo delete feature
- [ ] Delete confirmation with event details
- [ ] Integration with Notion page deletion 