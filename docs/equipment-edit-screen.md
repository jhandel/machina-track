# Equipment Edit Screen

This directory contains the edit screen for equipment management.

## Files Created/Modified

### New Files
- `src/app/(app)/equipment/[id]/edit/page.tsx` - Main edit form component

### Modified Files
- `src/app/(app)/equipment/page.tsx` - Updated dropdown menu Edit link
- No API changes needed (existing PUT endpoint already supported)

## Features

### Core Functionality
- ✅ Load existing equipment data
- ✅ Pre-populate form fields with current values
- ✅ Form validation (required fields)
- ✅ Update equipment via API
- ✅ Success/error handling with toast notifications
- ✅ Navigation back to equipment details after save

### User Experience Enhancements
- ✅ Loading skeleton while fetching data
- ✅ Error handling with retry functionality
- ✅ Form dirty state tracking
- ✅ Confirmation dialog for unsaved changes
- ✅ Consistent navigation patterns

### Form Fields
- Equipment Name (required)
- Model (required)
- Serial Number (required)
- Location (dropdown, required)
- Status (dropdown with current status selected)
- Purchase Date (date picker, optional)
- Image URL (optional)
- Notes (textarea, optional)

## Navigation Flow

1. **From Equipment List**: Click dropdown menu → "Edit"
2. **From Equipment Details**: Click "Edit" button
3. **After Saving**: Redirects to equipment details page
4. **Cancel/Back**: Returns to equipment details page (with unsaved changes confirmation)

## API Integration

Uses existing endpoints:
- `GET /api/equipment/[id]` - Fetch equipment data
- `PUT /api/equipment/[id]` - Update equipment

## Error Handling

- Network errors are caught and displayed
- Form validation prevents submission of invalid data
- Loading states prevent multiple submissions
- Retry functionality for failed data loads

## Accessibility

- Proper form labels and ARIA attributes
- Keyboard navigation support
- Screen reader friendly
- Clear error messages

## Dependencies

- Uses existing UI components from the shadcn/ui library
- Integrates with existing equipment service
- Follows established patterns from other edit forms in the app
