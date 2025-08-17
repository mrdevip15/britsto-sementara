# Reset Ujian Per Token Per Student Guide

## Overview
This feature allows administrators to reset exam data for specific tokens per student, providing granular control over exam resets.

## Features

### 1. Token-Specific Reset
- Reset exam data for a specific token without affecting other tokens
- Removes all exam history, answers, and completion status for the selected token
- Maintains data integrity for other tokens

### 2. Access Points

#### From User Report Page
1. Navigate to Admin Dashboard → Peserta Ujian
2. Click on the "View User Report" icon (file-text icon) for any user
3. In the user report, you'll see a table with all tokens and their exam data
4. Each row has a "Reset" button that allows you to reset that specific token's data

#### From Peserta Ujian Page
1. Navigate to Admin Dashboard → Peserta Ujian
2. Click on the "Reset Token Exams" icon (refresh-cw icon) for any user
3. This will take you to the user report page where you can perform token-specific resets

## How It Works

### Backend Implementation
- **Route**: `POST /admin/reset-user-token-exams/:userId/:tokenValue`
- **Controller**: `resetUserTokenExams` in `adminController.js`
- **Functionality**:
  1. Validates user and token existence
  2. Finds all mapel (subjects) associated with the token owner
  3. Removes exam data for those specific subjects:
     - `examTaken` entries for the token
     - `examCompleted` entries for the token
     - `answers` for the associated kodekategori
     - `disqualifiedExams` containing the kodekategori

### Frontend Implementation
- **User Report Page**: Shows token-specific reset buttons
- **Confirmation Dialog**: Uses SweetAlert2 for user confirmation
- **Success/Error Handling**: Provides clear feedback to administrators

## Data Structure

### Exam Data Organization
- **examTaken**: Array of objects with `tokenValue` and `kodekategories`
- **examCompleted**: Array of objects with `tokenValue`, `kodekategories`, and `scores`
- **answers**: Array of objects with `kodekategori` and `answer` arrays
- **disqualifiedExams**: Array of strings containing kodekategori

### Token-Mapel Relationship
- Tokens have an `owner` field
- Mapel (subjects) have an `owner` field that matches token owners
- This relationship allows the system to identify which subjects belong to which token

## Usage Examples

### Scenario 1: Reset Single Token
1. User has multiple tokens (e.g., "TOKEN_A" and "TOKEN_B")
2. Admin wants to reset only "TOKEN_A" data
3. Click reset button for "TOKEN_A" in user report
4. Only "TOKEN_A" data is removed, "TOKEN_B" remains intact

### Scenario 2: Multiple Subjects per Token
1. Token "TOKEN_X" has multiple subjects (Math, Physics, Chemistry)
2. Admin resets "TOKEN_X"
3. All exam data for Math, Physics, and Chemistry under "TOKEN_X" is removed
4. User can retake these subjects with the same token

## Security Features
- Admin authentication required
- Confirmation dialog prevents accidental resets
- Detailed logging of reset operations
- Token validation before reset

## Error Handling
- User not found: Returns 404 with appropriate message
- Token not found: Returns 404 with appropriate message
- Database errors: Returns 500 with generic error message
- Frontend errors: Shows user-friendly error messages

## Benefits
1. **Granular Control**: Reset specific tokens without affecting others
2. **Data Integrity**: Maintains clean separation between different exam sessions
3. **User Experience**: Allows students to retake specific exam packages
4. **Administrative Efficiency**: Quick and targeted reset operations
5. **Audit Trail**: Clear logging of reset operations

## Technical Notes
- Uses Sequelize ORM for database operations
- Implements proper error handling and validation
- Follows RESTful API design principles
- Uses SweetAlert2 for enhanced user interface
- Maintains backward compatibility with existing reset functionality
