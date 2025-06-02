# Migration Guide: From Direct Supabase Calls to API Routes

This guide explains how to migrate from direct Supabase client calls to using Next.js API routes.

## ✅ Migration Status

### Completed Migrations

The following files have been successfully migrated to use API routes:

#### Core Infrastructure
- ✅ `lib/supabase/server.ts` - Updated for Next.js 15 compatibility
- ✅ `lib/api/client.ts` - Complete API client implementation
- ✅ `hooks/useApi.ts` - React hooks for all API operations
- ✅ All API routes in `app/api/` - Complete server-side implementation

#### Authentication Components
- ✅ `components/SupabaseAuth.tsx` - Uses `useAuth` hook
- ✅ `components/nav-user.tsx` - Uses `useAuth` for sign out
- ✅ `components/admin/AuthProvider.tsx` - Uses API client for auth checks
- ✅ `app/(auth)/admin/login/page.tsx` - Uses API client for sign in

#### Form Management
- ✅ `lib/store/form-meta-store.ts` - Uses API client for form operations
- ✅ `lib/store/form-fields-store.ts` - Uses API client for field operations
- ✅ `app/(admin)/admin/forms/forms-client.tsx` - Uses hooks for form listing and creation

#### Form Rendering & Submission
- ✅ `components/form-builder/public-form-renderer.tsx` - Uses API client for form submission
- ✅ `components/form-builder/import-word-dialog.tsx` - Uses API client for form creation
- ✅ `app/(public)/forms/[id]/page.client.tsx` - Uses API client for form loading

### Remaining Files to Migrate

Based on the grep search, these files still need migration:

#### Medium Priority
- `components/form-builder/themed-form-renderer.tsx`
- `components/form-builder/modern-form-renderer.tsx`
- `lib/supabase/user-sync.ts`
- `lib/supabase/forms.ts`

#### Low Priority (Utility Files)
- Various admin pages that may have direct Supabase calls
- Other form builder components

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

## 🎯 Migration Examples

### Authentication
```typescript
// Before
const { data: { user }, error } = await supabase.auth.getUser()
const { error } = await supabase.auth.signInWithPassword({ email, password })

// After
const { user } = await apiClient.auth.getUser()
await apiClient.auth.signIn(email, password)

// Or using hooks
const { user, signIn, signOut } = useAuth()
```

### Forms Management
```typescript
// Before
const { data, error } = await supabase
  .from('forms')
  .select('*')
  .eq('user_id', user.id)

// After
const { forms } = await apiClient.forms.list()

// Or using hooks
const { data: formsData, loading, error } = useForms()
const forms = formsData?.forms || []
```

### Form Fields
```typescript
// Before
const { data, error } = await supabase
  .from('form_fields')
  .select('*')
  .eq('form_id', formId)

// After
const { fields } = await apiClient.fields.list(formId)

// Or using hooks
const { data: fieldsData } = useFormFields(formId)
const fields = fieldsData?.fields || []
```

### Form Responses
```typescript
// Before
const { data, error } = await supabase
  .from('form_responses')
  .insert({
    form_id: formId,
    response_data: responseData,
    user_id: user?.id
  })

// After
await apiClient.responses.submit(formId, responseData)

// Or using hooks
const { mutate: submitResponse } = useSubmitResponse()
await submitResponse({ formId, responseData })
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

### Completed ✅
- [x] Replace `import { supabase }` with API client/hooks in core files
- [x] Update authentication calls in auth components
- [x] Update form CRUD operations in stores and components
- [x] Update field management in stores
- [x] Update response handling in form renderers
- [x] Update form creation in import dialog
- [x] Remove unused Supabase imports from migrated files

### Remaining ⏳
- [ ] Update remaining form renderer components
- [ ] Update utility files in `lib/supabase/`
- [ ] Test all functionality thoroughly
- [ ] Update any remaining admin pages
- [ ] Performance monitoring

## 🔄 Next Steps

1. **Complete Remaining Files**: Migrate the remaining medium and low priority files
2. **Testing**: Test each migrated component thoroughly
3. **Performance**: Monitor API response times
4. **Caching**: Consider adding React Query for better caching
5. **Types**: Add proper TypeScript interfaces for better type safety

## 📚 Additional Resources

- [API Routes Summary](./API_ROUTES_SUMMARY.md) - Complete API reference
- [API Client Source](./lib/api/client.ts) - Full API client implementation
- [Hooks Source](./hooks/useApi.ts) - React hooks implementation 