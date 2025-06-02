'use server'

import { revalidateTag } from 'next/cache'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { CACHE_TAGS } from './cache'

// Server action to revalidate specific cache tags
// Only authenticated users can use this (add admin check as needed)
export async function revalidateCacheAction(tags: string | string[]) {
  try {
    // Ensure user is authenticated
    await getAuthenticatedUser()
    // TODO: Add admin role check here when role system is implemented
    
    const tagArray = Array.isArray(tags) ? tags : [tags]
    
    tagArray.forEach(tag => {
      revalidateTag(tag)
      console.log(`Revalidated cache tag: ${tag}`)
    })
    
    return { success: true, revalidated: tagArray }
  } catch (error) {
    console.error('Error revalidating cache:', error)
    throw new Error('Failed to revalidate cache')
  }
}

// Specific server actions for common revalidation scenarios
export async function revalidateFormsCache() {
  return revalidateCacheAction([CACHE_TAGS.FORMS, CACHE_TAGS.FORM])
}

export async function revalidateRolesCache() {
  return revalidateCacheAction([CACHE_TAGS.ROLES, CACHE_TAGS.ROLE])
}

export async function revalidatePermissionsCache() {
  return revalidateCacheAction([CACHE_TAGS.PERMISSIONS, CACHE_TAGS.PERMISSION])
}

export async function revalidateDashboardsCache() {
  return revalidateCacheAction([CACHE_TAGS.DASHBOARDS, CACHE_TAGS.DASHBOARD])
}

export async function revalidateFormFieldsCache() {
  return revalidateCacheAction([CACHE_TAGS.FORM_FIELDS, CACHE_TAGS.FORM])
}

export async function revalidateFormResponsesCache() {
  return revalidateCacheAction([CACHE_TAGS.FORM_RESPONSES])
}

// Emergency cache clear (admin only)
export async function clearAllCache() {
  try {
    // Ensure user is authenticated
    await getAuthenticatedUser()
    // TODO: Add strict admin role check here
    
    const allTags = Object.values(CACHE_TAGS)
    
    allTags.forEach(tag => {
      revalidateTag(tag)
      console.log(`Cleared cache tag: ${tag}`)
    })
    
    return { success: true, cleared: allTags }
  } catch (error) {
    console.error('Error clearing cache:', error)
    throw new Error('Failed to clear cache')
  }
} 