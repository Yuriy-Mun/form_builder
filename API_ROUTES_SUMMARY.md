# API Routes Summary

This document provides a complete overview of all API routes created to replace direct Supabase calls.

## 🚀 Quick Start

### 1. Import the API client or hooks
```typescript
// Using hooks (recommended for React components)
import { useAuth, useForms, useCreateForm } from '@/hooks/useApi'

// Using API client directly
import { apiClient } from '@/lib/api/client'
```

### 2. Use in your components
```typescript
function MyComponent() {
  const { user, signIn, signOut } = useAuth()
  const { data: forms, loading, error } = useForms()
  const { mutate: createForm } = useCreateForm()

  // Component logic here...
}
```

## 📋 Complete API Reference

### Authentication Routes

| Method | Endpoint | Description | Body | Response |
|--------|----------|-------------|------|----------|
| GET | `/api/auth/user` | Get current user | - | `{ user }` |
| POST | `/api/auth/signin` | Sign in user | `{ email, password }` | `{ user, session }` |
| POST | `/api/auth/signup` | Sign up user | `{ email, password, options? }` | `{ user, session }` |
| POST | `/api/auth/signout` | Sign out user | - | `{ message }` |

### Forms Routes

| Method | Endpoint | Description | Body | Response |
|--------|----------|-------------|------|----------|
| GET | `/api/forms` | Get all user forms | - | `{ forms }` |
| POST | `/api/forms` | Create new form | `{ title, description?, active? }` | `{ form }` |
| GET | `/api/forms/[id]` | Get specific form | - | `{ form }` |
| PUT | `/api/forms/[id]` | Update form | `{ title?, description?, active? }` | `{ form }` |
| DELETE | `/api/forms/[id]` | Delete form | - | `{ message }` |

### Form Fields Routes

| Method | Endpoint | Description | Body | Response |
|--------|----------|-------------|------|----------|
| GET | `/api/forms/[id]/fields` | Get form fields | - | `{ fields }` |
| POST | `/api/forms/[id]/fields` | Create field | `{ type, label, required, ... }` | `{ field }` |
| PUT | `/api/forms/[id]/fields` | Bulk update fields | `{ fields }` | `{ fields }` |
| PUT | `/api/forms/[id]/fields/[fieldId]` | Update specific field | `{ label?, required?, ... }` | `{ field }` |
| DELETE | `/api/forms/[id]/fields/[fieldId]` | Delete field | - | `{ message }` |

### Form Responses Routes

| Method | Endpoint | Description | Body | Response |
|--------|----------|-------------|------|----------|
| GET | `/api/forms/[id]/responses` | Get form responses | - | `{ responses }` |
| POST | `/api/forms/[id]/responses` | Submit response (public) | `{ response_data }` | `{ response }` |

### Roles Routes

| Method | Endpoint | Description | Body | Response |
|--------|----------|-------------|------|----------|
| GET | `/api/roles` | Get all roles | - | `{ roles }` |
| POST | `/api/roles` | Create role | `{ name, description?, active? }` | `{ role }` |
| GET | `/api/roles/[id]` | Get specific role | - | `{ role }` |
| PUT | `/api/roles/[id]` | Update role | `{ name?, description?, active? }` | `{ role }` |
| DELETE | `/api/roles/[id]` | Delete role | - | `{ message }` |

### Role-Permission Routes

| Method | Endpoint | Description | Body | Response |
|--------|----------|-------------|------|----------|
| GET | `/api/roles/[id]/permissions` | Get role permissions | - | `{ permissions }` |
| POST | `/api/roles/[id]/permissions` | Add permissions to role | `{ permission_ids }` | `{ role_permissions }` |
| DELETE | `/api/roles/[id]/permissions` | Remove permissions from role | `{ permission_ids }` | `{ message }` |

### Permissions Routes

| Method | Endpoint | Description | Body | Response |
|--------|----------|-------------|------|----------|
| GET | `/api/permissions` | Get all permissions | - | `{ permissions }` |
| POST | `/api/permissions` | Create permission | `{ name, slug, description? }` | `{ permission }` |
| GET | `/api/permissions/[id]` | Get specific permission | - | `{ permission }` |
| PUT | `/api/permissions/[id]` | Update permission | `{ name?, slug?, description? }` | `{ permission }` |
| DELETE | `/api/permissions/[id]` | Delete permission | - | `{ message }` |

### Dashboards Routes

| Method | Endpoint | Description | Body | Response |
|--------|----------|-------------|------|----------|
| GET | `/api/dashboards` | Get all user dashboards | - | `{ dashboards }` |
| POST | `/api/dashboards` | Create dashboard | `{ name, description? }` | `{ dashboard }` |
| GET | `/api/dashboards/[id]` | Get specific dashboard | - | `{ dashboard }` |
| PUT | `/api/dashboards/[id]` | Update dashboard | `{ name?, description? }` | `{ dashboard }` |
| DELETE | `/api/dashboards/[id]` | Delete dashboard | - | `{ message }` |

## 🎯 Usage Examples

### Authentication
```typescript
// Sign in
const { user } = await apiClient.auth.signIn('user@example.com', 'password')

// Get current user
const { user } = await apiClient.auth.getUser()

// Sign out
await apiClient.auth.signOut()
```

### Forms Management
```typescript
// Get all forms
const { forms } = await apiClient.forms.list()

// Create form
const { form } = await apiClient.forms.create({
  title: 'Contact Form',
  description: 'A simple contact form',
  active: true
})

// Update form
const { form } = await apiClient.forms.update('form-id', {
  title: 'Updated Contact Form'
})

// Delete form
await apiClient.forms.delete('form-id')
```

### Form Fields
```typescript
// Get form fields
const { fields } = await apiClient.fields.list('form-id')

// Create field
const { field } = await apiClient.fields.create('form-id', {
  type: 'text',
  label: 'Full Name',
  required: true,
  placeholder: 'Enter your full name'
})

// Bulk update fields
const { fields } = await apiClient.fields.bulkUpdate('form-id', [
  { id: 'field-1', label: 'Updated Label' },
  { id: 'field-2', required: false }
])
```

### Form Responses
```typescript
// Submit response (public endpoint)
const { response } = await apiClient.responses.submit('form-id', {
  'field-1': 'John Doe',
  'field-2': 'john@example.com'
})

// Get responses (admin only)
const { responses } = await apiClient.responses.list('form-id')
```

### Roles and Permissions
```typescript
// Get all roles
const { roles } = await apiClient.roles.list()

// Create role
const { role } = await apiClient.roles.create({
  name: 'Editor',
  description: 'Can edit content'
})

// Get role permissions
const { permissions } = await apiClient.roles.getPermissions('role-id')

// Add permissions to role
await apiClient.roles.addPermissions('role-id', ['perm-1', 'perm-2'])

// Remove permissions from role
await apiClient.roles.removePermissions('role-id', ['perm-1'])
```

## 🔧 React Hooks

### Available Hooks

#### Data Fetching Hooks
- `useAuth()` - Authentication state and methods
- `useForms()` - Get all forms
- `useForm(id)` - Get specific form
- `useFormFields(formId)` - Get form fields
- `useFormResponses(formId)` - Get form responses
- `useRoles()` - Get all roles
- `useRole(id)` - Get specific role
- `usePermissions()` - Get all permissions
- `usePermission(id)` - Get specific permission
- `useDashboards()` - Get all dashboards
- `useDashboard(id)` - Get specific dashboard

#### Mutation Hooks
- `useCreateForm()` - Create form
- `useUpdateForm()` - Update form
- `useDeleteForm()` - Delete form
- `useCreateField()` - Create field
- `useUpdateField()` - Update field
- `useDeleteField()` - Delete field
- `useBulkUpdateFields()` - Bulk update fields
- `useSubmitResponse()` - Submit form response

### Hook Usage Examples

```typescript
function FormsList() {
  const { data: forms, loading, error, refetch } = useForms()
  const { mutate: createForm, loading: creating } = useCreateForm()

  const handleCreate = async () => {
    try {
      await createForm({ title: 'New Form' })
      refetch() // Refresh the list
    } catch (error) {
      console.error('Failed to create form:', error)
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      {forms?.map(form => (
        <div key={form.id}>{form.title}</div>
      ))}
      <button onClick={handleCreate} disabled={creating}>
        {creating ? 'Creating...' : 'Create Form'}
      </button>
    </div>
  )
}
```

## 🔒 Security Features

1. **Server-side Authentication**: All routes verify user authentication server-side
2. **User Isolation**: Forms and dashboards are filtered by user_id
3. **Input Validation**: Request bodies are validated before processing
4. **Error Handling**: Consistent error responses with appropriate HTTP status codes
5. **Type Safety**: Full TypeScript support for request/response types

## 🚨 Error Handling

All API routes return consistent error responses:

```typescript
// Success response
{ data: any, ...otherFields }

// Error response
{ error: string }
```

HTTP Status Codes:
- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `404` - Not Found
- `500` - Internal Server Error

## 📝 Migration Checklist

- [ ] Replace `import { supabase }` with API client/hooks
- [ ] Update authentication calls
- [ ] Update form CRUD operations
- [ ] Update field management
- [ ] Update response handling
- [ ] Update role/permission management
- [ ] Test all functionality
- [ ] Update error handling
- [ ] Remove unused Supabase imports

## 🔄 Next Steps

1. **Gradual Migration**: Start with high-priority components
2. **Testing**: Test each migrated component thoroughly
3. **Performance**: Monitor API response times
4. **Caching**: Consider adding React Query for better caching
5. **Types**: Add proper TypeScript interfaces for better type safety

## 📚 Additional Resources

- [Migration Guide](./MIGRATION_GUIDE.md) - Detailed migration instructions
- [API Client Source](./lib/api/client.ts) - Full API client implementation
- [Hooks Source](./hooks/useApi.ts) - React hooks implementation 