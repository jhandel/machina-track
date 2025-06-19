# CalibrationLogForm Upload Fix

## Problem Identified
The CalibrationLogForm was allowing form submission before file uploads were complete, causing:
1. Form submission happened immediately on submit button click
2. File uploads were happening independently via RealtimeUploadComponent
3. No validation to ensure upload completion before saving
4. Modal would close and metrology tool would update without the certificate being uploaded

## Root Cause
The form submission logic was not connected to the upload state. The `RealtimeUploadComponent` was operating independently and just setting `pendingCertificateUrl` when complete, but there was no mechanism to:
- Detect if a file was selected but not uploaded
- Prevent form submission during active uploads
- Provide clear feedback about upload requirements

## Solution Implemented

### 1. Added Upload State Tracking
```tsx
const [hasFileSelected, setHasFileSelected] = useState(false);
const [isUploadInProgress, setIsUploadInProgress] = useState(false);
```

### 2. Enhanced Upload Callbacks
Extended `RealtimeUploadComponent` with new callbacks:
- `onUploadStart()` - Called when upload begins
- `onFileSelected(file)` - Called when a file is selected/deselected

### 3. Form Submission Validation
Added checks before allowing form submission:
```tsx
// Check if there's a file selected but not yet uploaded
if (hasFileSelected && !pendingCertificateUrl && !formData.certificateUrl) {
  toast({
    title: "Upload Required",
    description: "Please upload the calibration certificate before saving the log.",
    variant: "destructive",
  });
  return;
}

// Check if upload is in progress
if (isUploadInProgress) {
  toast({
    title: "Upload In Progress", 
    description: "Please wait for the certificate upload to complete before saving.",
    variant: "default",
  });
  return;
}
```

### 4. Dynamic Submit Button States
The submit button now shows different states:
- **Normal**: "Save Calibration Log" 
- **File Selected, Not Uploaded**: "Upload Certificate First"
- **Upload In Progress**: "Upload in Progress..." (disabled)
- **Saving**: "Saving..." (disabled)

### 5. Visual Feedback Messages
Added contextual status messages:
- ✅ **Upload Complete**: "New certificate uploaded and ready to be saved"
- ⚠️ **Upload Required**: "File selected but not yet uploaded. Please click Upload"
- ⏳ **Upload In Progress**: "Upload in progress... Please wait"

### 6. State Management
Enhanced state management to track:
- Whether a file is selected
- Whether an upload is in progress
- Pending certificate URL from completed uploads
- Proper state reset on form completion

## User Flow Now
1. **File Selection**: User selects a file → "Upload Certificate First" button appears
2. **Upload**: User clicks Upload → Progress bar shows real-time status
3. **Upload Complete**: Success message appears → "Save Calibration Log" button enabled
4. **Form Submit**: Only allowed when upload is complete or no file selected
5. **Success**: Form saves with certificate URL, all states reset

## Technical Changes Made

### RealtimeUploadComponent Updates
- Added `onUploadStart` and `onFileSelected` callback props
- Enhanced file selection handler to notify parent component
- Upload start handler calls parent callback

### CalibrationLogForm Updates
- Added upload state tracking variables
- Enhanced form submission validation
- Dynamic submit button rendering based on upload state
- Comprehensive user feedback messages
- Proper state cleanup on form completion

## Benefits
1. **Prevents Data Loss**: No more lost uploads due to premature form submission
2. **Clear User Guidance**: Users know exactly what they need to do
3. **Proper State Management**: Upload and form states are synchronized
4. **Better UX**: Visual feedback at every step of the process
5. **Error Prevention**: Multiple validation layers prevent invalid submissions

The form now properly coordinates the file upload process with form submission, ensuring certificates are uploaded before the calibration log is saved.
