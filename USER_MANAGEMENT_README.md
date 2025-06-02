# User Management System

This document describes the user management system implementation for the Form Builder application.

## Overview

The user management system provides a comprehensive interface for administrators to manage users, their roles, and permissions within the application. It includes full CRUD operations, role-based access control, and user status management.

## Architecture

### API Routes

#### `/api/users` (GET, POST)
- **GET**: Fetches all users with their roles and authentication data
- **POST**: Creates new users via Supabase Admin API

#### `/api/users/[id]` (GET, PUT, DELETE)
- **GET**: Fetches specific user with detailed role/permission data
- **PUT**: Updates user data in both auth and public tables
- **DELETE**: Removes user from both tables with proper cleanup

### Database Structure

The system works with two main tables:
- `auth.users`: Supabase authentication table
- `public.users`: Application-specific user data with role relationships

### Hooks

#### `useUsers.ts`
Provides comprehensive hooks for user management:
- `useUsers()`: Fetches all users
- `useUser(id)`: Fetches specific user
- `useCreateUser()`: Creates new user
- `useUpdateUser()`: Updates user data
- `useDeleteUser()`: Removes user

## Features

### User Management Page (`/admin/users`)

#### Statistics Dashboard
- Total users count
- Active users count
- Banned users count
- Total roles count

#### User Table
- Displays users with avatars, roles, and status
- Sortable and filterable by email and role
- Shows last sign-in time and creation date
- Action dropdown for each user

#### Filtering & Search
- Search by email
- Filter by role
- Real-time filtering

### User Operations

#### Create User
- Email and password validation
- Role assignment
- User metadata (full name, phone)
- Email confirmation sent automatically

#### Edit User
- Update email, role, and metadata
- Preserves existing data
- Real-time validation

#### Delete User
- Confirmation dialog with email verification
- Removes from both auth and public tables
- Cascading deletion of related data

#### Ban/Unban User
- 30-day ban duration
- Toggle ban status
- Visual status indicators

#### View Permissions
- Shows all permissions through user's role
- Categorized permission display
- Read-only permission overview

## Components

### Dialog Components

#### `CreateUserDialog.tsx`
- Form for creating new users
- Role selection dropdown
- Metadata fields for additional user info

#### `EditUserDialog.tsx`
- Pre-populated form for editing users
- Same validation as create dialog
- Updates existing user data

#### `DeleteUserDialog.tsx`
- Confirmation dialog with safety checks
- Requires email confirmation
- Shows user information before deletion

#### `UserPermissionsDialog.tsx`
- Read-only permissions viewer
- Categorized permission display
- Shows role-based permissions

### Main Page Component

#### `page.tsx`
- Main user management interface
- Integrates all dialog components
- Handles state management and user interactions

## Security Features

### Authentication
- All API routes require authentication
- User session validation on each request

### Authorization
- Role-based access control
- Permission checking through roles
- Admin-only access to user management

### Data Validation
- Email format validation
- Password strength requirements
- Role existence verification

## Error Handling

### API Level
- Comprehensive error catching
- Proper HTTP status codes
- Detailed error messages

### UI Level
- Toast notifications for all operations
- Loading states during operations
- Error state handling with retry options

## Dependencies

### Core Dependencies
- Next.js 15 with App Router
- React 19
- TypeScript
- Supabase (Auth & Database)

### UI Dependencies
- shadcn/ui components
- Lucide React icons
- Sonner for toast notifications
- date-fns for date formatting

### Development Dependencies
- ESLint for code quality
- Bun as package manager

## Usage Examples

### Creating a User
```typescript
const { createUser } = useCreateUser()

await createUser({
  email: 'user@example.com',
  password: 'securepassword',
  role_id: 'role-uuid',
  user_metadata: {
    full_name: 'John Doe',
    phone: '+1234567890'
  }
})
```

### Updating a User
```typescript
const { updateUser } = useUpdateUser()

await updateUser('user-id', {
  email: 'newemail@example.com',
  role_id: 'new-role-id',
  user_metadata: {
    full_name: 'Jane Doe'
  }
})
```

### Banning a User
```typescript
const { updateUser } = useUpdateUser()

await updateUser('user-id', {
  banned_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
})
```

## Best Practices

### Data Management
- Always validate user input
- Use TypeScript interfaces for type safety
- Handle loading and error states properly

### Security
- Never expose sensitive user data
- Validate permissions on both client and server
- Use proper authentication checks

### User Experience
- Provide clear feedback for all operations
- Use confirmation dialogs for destructive actions
- Show loading states during async operations

## Future Enhancements

### Planned Features
- Bulk user operations
- User import/export functionality
- Advanced filtering options
- User activity logs
- Email templates customization

### Performance Optimizations
- Pagination for large user lists
- Virtual scrolling for better performance
- Caching strategies for frequently accessed data

## Troubleshooting

### Common Issues

#### User Creation Fails
- Check email format validation
- Verify role exists and is active
- Ensure password meets requirements

#### Permission Errors
- Verify user has admin role
- Check Supabase RLS policies
- Validate API authentication

#### UI Not Loading
- Check for missing dependencies
- Verify component imports
- Check console for JavaScript errors

### Debug Mode
Enable debug logging by setting environment variables:
```bash
NEXT_PUBLIC_DEBUG=true
```

## Contributing

When contributing to the user management system:

1. Follow TypeScript best practices
2. Add proper error handling
3. Include loading states
4. Write comprehensive tests
5. Update documentation

## License

This user management system is part of the Form Builder application and follows the same licensing terms. 