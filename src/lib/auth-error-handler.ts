/**
 * Global auth error handler
 * Monitors for refresh token errors and handles them gracefully
 */

let isHandlingRefreshError = false;

export function setupAuthErrorHandler() {
  // Monitor fetch requests to detect refresh token errors
  const originalFetch = window.fetch;
  
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    
    // Check for auth token refresh errors
    if (
      response.url.includes('/auth/v1/token') &&
      response.url.includes('grant_type=refresh_token') &&
      response.status === 400
    ) {
      console.warn('Refresh token error detected (400) - will force logout');
      
      // Only handle once to avoid loops
      if (!isHandlingRefreshError) {
        isHandlingRefreshError = true;
        handleInvalidRefreshToken();
      }
    }
    
    return response;
  };
}

async function handleInvalidRefreshToken() {
  console.log('Handling invalid refresh token - clearing storage and redirecting to login');
  
  try {
    // Clear all Supabase auth data from localStorage
    const keysToRemove = Object.keys(localStorage).filter(
      key => key.startsWith('supabase') || key.includes('auth-token')
    );
    keysToRemove.forEach(key => {
      console.log('Removing localStorage key:', key);
      localStorage.removeItem(key);
    });
    
    // Also clear sessionStorage
    const sessionKeys = Object.keys(sessionStorage).filter(
      key => key.startsWith('supabase') || key.includes('auth-token')
    );
    sessionKeys.forEach(key => {
      console.log('Removing sessionStorage key:', key);
      sessionStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
  
  // Redirect to login after a short delay to allow cleanup
  setTimeout(() => {
    if (window.location.pathname !== '/login') {
      console.log('Redirecting to login page');
      window.location.href = '/login?error=session_expired';
    }
    isHandlingRefreshError = false;
  }, 500);
}

export function resetRefreshErrorHandler() {
  isHandlingRefreshError = false;
}
