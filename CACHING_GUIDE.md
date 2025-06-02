# Tagged Caching System Guide

This guide explains the tagged caching system implemented in the form builder application using Next.js 15's `unstable_cache` and `revalidateTag` APIs.

## Overview

The caching system provides:
- **Performance optimization** through cached database queries
- **Granular cache invalidation** using tags
- **Automatic revalidation** when data changes
- **Consistent data** across the application
- **Security** through proper authentication and authorization

## Security Considerations

### Service Key Usage
Cached functions use the Supabase service key to bypass RLS (Row Level Security) for performance reasons. This is safe because:
1. User ID is explicitly passed and validated in all queries
2. Cached functions only perform read operations
3. All data access is properly filtered by user ownership

### Environment Variables Required
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Required for caching
```

### Manual Cache Revalidation Security
- ❌ **Removed**: Public API endpoint `/api/revalidate` (security risk)
- ✅ **Added**: Authenticated Server Actions in `lib/cache-actions.ts`
- ✅ **Automatic**: Cache revalidation in API routes after mutations

## Cache Tags

The following cache tags are defined in `lib/cache.ts`:

```typescript
export const CACHE_TAGS = {
  FORMS: 'forms',
  FORM: 'form',
  ROLES: 'roles',
  ROLE: 'role',
  PERMISSIONS: 'permissions',
  PERMISSION: 'permission',
  DASHBOARDS: 'dashboards',
  DASHBOARD: 'dashboard',
  FORM_FIELDS: 'form-fields',
  FORM_RESPONSES: 'form-responses',
  ROLE_PERMISSIONS: 'role-permissions',
} as const
```

## Cache Durations

Different cache durations are configured based on data volatility:

```typescript
export const CACHE_DURATIONS = {
  SHORT: 60,      // 1 minute - for frequently changing data (responses)
  MEDIUM: 300,    // 5 minutes - for moderately changing data (forms, dashboards)
  LONG: 3600,     // 1 hour - for rarely changing data (roles)
  VERY_LONG: 86400, // 24 hours - for very stable data (permissions)
} as const
```

## Cached Functions

### Forms
- `getCachedForms(userId)` - Get all forms for a user
- `getCachedForm(formId, userId)` - Get specific form
- `getCachedFormFields(formId, userId)` - Get form fields
- `getCachedFormResponses(formId, userId)` - Get form responses

### Roles & Permissions
- `getCachedRoles()` - Get all roles
- `getCachedRole(roleId)` - Get specific role
- `getCachedRolePermissions(roleId)` - Get role permissions
- `getCachedPermissions()` - Get all permissions
- `getCachedPermission(permissionId)` - Get specific permission

### Dashboards
- `getCachedDashboards(userId)` - Get all dashboards for a user
- `getCachedDashboard(dashboardId, userId)` - Get specific dashboard

## API Route Implementation

### GET Routes (Using Cache)

All GET API routes now use cached functions:

```typescript
// Example: app/api/forms/route.ts
export async function GET() {
  try {
    const user = await getAuthenticatedUser()
    const forms = await getCachedForms(user.id)
    return NextResponse.json({ forms })
  } catch (error) {
    console.error('Error fetching forms:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### Mutation Routes (With Revalidation)

All POST, PUT, DELETE routes include cache revalidation:

```typescript
// Example: app/api/forms/route.ts
export async function POST(request: NextRequest) {
  try {
    // ... create form logic ...
    
    // Revalidate forms cache
    revalidateTag(CACHE_TAGS.FORMS)
    
    return NextResponse.json({ form: data })
  } catch (error) {
    // ... error handling ...
  }
}
```

## Cache Revalidation Strategy

### When to Revalidate

1. **Create operations**: Revalidate collection tags
2. **Update operations**: Revalidate both item and collection tags
3. **Delete operations**: Revalidate all related tags

### Revalidation Examples

```typescript
// Creating a form
revalidateTag(CACHE_TAGS.FORMS)

// Updating a form
revalidateTag(CACHE_TAGS.FORM)
revalidateTag(CACHE_TAGS.FORMS)

// Deleting a form
revalidateTag(CACHE_TAGS.FORM)
revalidateTag(CACHE_TAGS.FORMS)
revalidateTag(CACHE_TAGS.FORM_FIELDS)
revalidateTag(CACHE_TAGS.FORM_RESPONSES)
```

## Manual Cache Revalidation (Secure)

### Using Server Actions (Recommended)

```typescript
import { 
  revalidateFormsCache,
  revalidateRolesCache,
  clearAllCache 
} from '@/lib/cache-actions'

// In a server component or server action
await revalidateFormsCache()
await revalidateRolesCache()
await clearAllCache() // Admin only
```

### Available Server Actions

```typescript
// Specific cache revalidation
revalidateFormsCache()
revalidateRolesCache()
revalidatePermissionsCache()
revalidateDashboardsCache()
revalidateFormFieldsCache()
revalidateFormResponsesCache()

// Emergency cache clear (admin only)
clearAllCache()

// Generic revalidation
revalidateCacheAction(['forms', 'roles'])
```

## Best Practices

### 1. Tag Naming
- Use descriptive, consistent tag names
- Use plural for collections (`forms`) and singular for items (`form`)
- Use kebab-case for multi-word tags (`form-fields`)

### 2. Cache Duration Selection
- **SHORT (1 min)**: Frequently changing data (form responses)
- **MEDIUM (5 min)**: Moderately changing data (forms, dashboards)
- **LONG (1 hour)**: Rarely changing data (roles)
- **VERY_LONG (24 hours)**: Very stable data (permissions)

### 3. Revalidation Strategy
- Always revalidate related tags when data changes
- Consider cascading effects (deleting a form affects fields and responses)
- Use specific tags for granular control

### 4. Security
- Never expose cache revalidation endpoints publicly
- Use authenticated Server Actions for manual revalidation
- Validate user permissions before cache operations
- Use service key only for read operations with proper filtering

### 5. Error Handling
- Cached functions should throw errors for proper error handling
- API routes should catch and handle cache-related errors gracefully

## Monitoring and Debugging

### Cache Hit/Miss Logging
Enable cache debugging in development:

```bash
NEXT_PRIVATE_DEBUG_CACHE=1
```

### Revalidation Logging
All revalidation operations are logged:

```typescript
console.log(`Revalidated cache tag: ${tag}`)
```

## Performance Benefits

1. **Reduced Database Load**: Cached queries minimize database hits
2. **Faster Response Times**: Instant serving of cached data
3. **Better User Experience**: Faster page loads and interactions
4. **Scalability**: Improved performance under load
5. **Security**: Proper authentication and authorization

## Cache Invalidation Scenarios

### Form Operations
- **Create form**: Invalidates `forms`
- **Update form**: Invalidates `form`, `forms`
- **Delete form**: Invalidates `form`, `forms`, `form-fields`, `form-responses`

### Field Operations
- **Create/Update/Delete field**: Invalidates `form-fields`, `form`

### Response Operations
- **Create response**: Invalidates `form-responses`

### Role/Permission Operations
- **Role changes**: Invalidates `role`, `roles`, `role-permissions`
- **Permission changes**: Invalidates `permission`, `permissions`, `role-permissions`

## Security Improvements

### What Was Changed
1. **Removed** public `/api/revalidate` endpoint (security vulnerability)
2. **Added** authenticated Server Actions for manual revalidation
3. **Implemented** service key usage for cached functions
4. **Enhanced** error handling and logging

### Migration Notes

All existing API routes have been updated to:
1. Use cached functions for GET operations
2. Include proper revalidation for mutation operations
3. Maintain the same API interface for backward compatibility
4. Use secure authentication for cache management

The caching system is transparent to the frontend - no changes required in components or pages. 