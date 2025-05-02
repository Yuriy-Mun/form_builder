# Form Builder Project - Product Requirements Document

## Overview
This document outlines the requirements and development plan for a Form Builder application using Next.js and Supabase. The application will allow administrators to create customizable forms with various field types and conditional logic, view form responses, and share public links to forms. Users accessing these forms must authenticate, and the system should support resuming partially completed forms.

## Objectives
- Enable administrators to design forms with diverse field types (text, multiple choice, dropdown, etc.) and dependencies (conditional fields based on previous answers).
- Provide administrators with the ability to view and analyze form responses.
- Generate public links for forms that can be shared on social media, requiring user authentication to access.
- Allow authenticated users to resume filling out forms from their last point of completion.

## Key Features

### Administrator Features
1. **Form Creation and Management**
   - Create new forms with a user-friendly interface.
   - Add various field types: text input, textarea, radio buttons, checkboxes, dropdowns, date pickers, etc.
   - Implement conditional logic for fields (show/hide based on previous answers).
   - Preview forms before publishing.
2. **Response Management**
   - View a list of submitted responses for each form.
   - Access detailed views of individual responses.
   - Export responses in CSV format for analysis.
   - Visualize respondent data through circular dashboards displaying:
     - Top cities of respondents.
     - Age distribution of respondents.
     - Gender distribution of respondents.
     - Average health rating based on form responses.
   - Display statistics on the number of fully completed forms and the number of incomplete responses.
3. **Form Sharing**
   - Generate a unique public link for each form.
   - Ability to enable/disable public access to forms.

### User Features
1. **Form Access and Authentication**
   - Access forms via public links, redirected to login if not authenticated.
   - Support for Supabase authentication (email/password, social logins if configured).
2. **Form Completion**
   - Fill out forms with validation for required fields.
   - Save progress automatically, allowing users to resume later.
   - Submit completed forms with confirmation feedback.

## Technical Plan

### Technology Stack
- **Frontend**: Next.js with React, using App Router for routing and Shadcn UI for components.
- **Backend**: Supabase for authentication, database, and storage.
- **State Management**: React Context or Redux for managing form state.
- **Form Handling**: React Hook Form for form validation and state management.

### Project Structure
- **Routes**:
  - `app/(admin)/admin/forms/`: Interface for form creation, editing, and management.
  - `app/(admin)/admin/forms/[id]/responses/`: View responses for a specific form.
  - `app/(public)/forms/[id]`: Public-facing form page for users to fill out.
- **Components**:
  - `components/form-builder/`: Components for building forms (field types, conditional logic UI).
  - `components/form-viewer/`: Components for rendering forms to users.
  - Reuse existing `components/ui/` for consistent UI elements.
- **Database Schema** (Supabase):
  - `forms`: Table to store form metadata (id, title, description, created_by, created_at, updated_at).
  - `form_fields`: Table for form field definitions (id, form_id, type, label, options, required, conditional_logic).
  - `form_responses`: Table for storing user responses (id, form_id, user_id, completed_at, data).
  - `form_progress`: Table for saving in-progress form data (id, form_id, user_id, data, updated_at).

### Authentication and Authorization
- **Admin Access**: Protected routes under `app/(admin)/` requiring `admin.access` permission.
- **User Access**: Public form links require authentication; users are redirected to login if not authenticated.
- **Middleware**: Extend existing middleware to handle form-specific access rules.

### Development Phases

#### Phase 1: Setup and Core Infrastructure
- Set up new routes for form management and public access.
- Define Supabase database schema for forms, fields, responses, and progress.
- Implement basic form creation UI for administrators.

#### Phase 2: Form Builder Functionality
- Develop form builder interface with drag-and-drop for field arrangement.
- Implement support for different field types and configurations.
- Add conditional logic feature for fields.
- Create preview functionality for forms.

#### Phase 3: Form Viewing and Submission
- Build public form viewer with React Hook Form for validation.
- Implement auto-save functionality for in-progress forms.
- Create submission logic and confirmation UI.

#### Phase 4: Response Management
- Develop response listing and detail views for administrators.
- Add export functionality for responses.
- Implement circular dashboards for visualizing respondent demographics and form data (city, age, gender, health rating).
- Add statistics display for completed and incomplete form responses.

#### Phase 5: Sharing and Authentication
- Implement public link generation for forms.
- Ensure authentication flow for public form access.
- Test resume functionality for partially completed forms.

#### Phase 6: Testing and Polish
- Conduct thorough testing of form creation, submission, and response management.
- Optimize performance for form rendering and data handling.
- Refine UI/UX based on feedback.

## Security Considerations
- Ensure proper validation and sanitization of form data to prevent injection attacks.
- Use Supabase Row Level Security (RLS) to restrict access to form data based on user roles.
- Implement rate limiting for form submissions to prevent abuse.

## Future Enhancements
- Add support for custom themes or styling for forms.
- Implement analytics for form performance (completion rates, drop-off points).
- Allow integration with third-party tools (e.g., email notifications on form submission).

## Timeline
- **Phase 1**: 1-2 weeks
- **Phase 2**: 2-3 weeks
- **Phase 3**: 2 weeks
- **Phase 4**: 1-2 weeks
- **Phase 5**: 1 week
- **Phase 6**: 1-2 weeks
- **Total Estimated Time**: 8-12 weeks

This plan provides a comprehensive roadmap for developing the Form Builder application, leveraging the existing Next.js and Supabase setup to meet the specified requirements.
