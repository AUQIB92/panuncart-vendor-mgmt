/**
 * Enhanced Auth Utilities for Vendor Login
 * Handles refresh token issues and session management
 */

import { createClient } from '@/lib/supabase/client'

/**
 * Attempts to refresh the session and handle common auth errors
 */
export async function refreshUserSession() {
  const supabase = createClient()
  
  try {
    // Try to get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.log('Session error:', sessionError.message)
      return { success: false, error: sessionError.message }
    }
    
    if (!session) {
      console.log('No active session found')
      return { success: false, error: 'No session' }
    }
    
    // Try to refresh the session
    const { data, error } = await supabase.auth.refreshSession()
    
    if (error) {
      console.log('Refresh session error:', error.message)
      
      // Handle specific refresh token errors
      if (error.message.includes('Invalid Refresh Token') || 
          error.message.includes('Refresh Token Not Found')) {
        // Clear local storage and redirect to login
        localStorage.removeItem('sb-access-token')
        localStorage.removeItem('sb-refresh-token')
        return { success: false, error: 'Session expired - please log in again' }
      }
      
      return { success: false, error: error.message }
    }
    
    console.log('Session refreshed successfully')
    return { success: true, session: data.session }
    
  } catch (error) {
    console.error('Unexpected error during session refresh:', error)
    return { success: false, error: 'Authentication service unavailable' }
  }
}

/**
 * Enhanced login function with better error handling
 */
export async function enhancedLogin(email: string, password: string) {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      console.log('Login error:', error.message)
      
      // Handle specific error cases
      if (error.message.includes('Invalid login credentials')) {
        return { 
          success: false, 
          error: 'Invalid email or password. Please check your credentials.' 
        }
      }
      
      if (error.message.includes('Email not confirmed')) {
        return { 
          success: false, 
          error: 'Please confirm your email address before logging in.' 
        }
      }
      
      return { success: false, error: error.message }
    }
    
    console.log('Login successful for user:', data.user?.email)
    return { success: true, user: data.user, session: data.session }
    
  } catch (error) {
    console.error('Unexpected login error:', error)
    return { success: false, error: 'Login service unavailable. Please try again.' }
  }
}

/**
 * Check if user session is valid
 */
export async function validateSession() {
  const supabase = createClient()
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      return { isValid: false, error: error?.message || 'No session' }
    }
    
    // Check if session is close to expiry (within 5 minutes)
    const expiresAt = session.expires_at
    if (expiresAt) {
      const now = Math.floor(Date.now() / 1000)
      const timeUntilExpiry = expiresAt - now
      
      if (timeUntilExpiry < 300) { // 5 minutes
        console.log('Session expiring soon, attempting refresh...')
        const refreshResult = await refreshUserSession()
        return refreshResult.success 
          ? { isValid: true, session: refreshResult.session }
          : { isValid: false, error: refreshResult.error }
      }
    }
    
    return { isValid: true, session }
    
  } catch (error) {
    console.error('Session validation error:', error)
    return { isValid: false, error: 'Session validation failed' }
  }
}
