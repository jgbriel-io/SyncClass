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
      // Only handle once to avoid loops
      if (!isHandlingRefreshError) {
        isHandlingRefreshError = true;
        handleInvalidRefreshToken();
      }
    }
    
    return response;
  };
}

function handleInvalidRefreshToken() {
  try {
    const keysToRemove = Object.keys(localStorage).filter(
      key => key.startsWith('supabase') || key.includes('auth-token')
    );
    keysToRemove.forEach(key => localStorage.removeItem(key));

    const sessionKeys = Object.keys(sessionStorage).filter(
      key => key.startsWith('supabase') || key.includes('auth-token')
    );
    sessionKeys.forEach(key => sessionStorage.removeItem(key));
  } catch {
    // ignore
  }

  setTimeout(() => {
    if (window.location.pathname !== '/login') {
      window.location.href = '/login?error=session_expired';
    }
    isHandlingRefreshError = false;
  }, 500);
}

export function resetRefreshErrorHandler() {
  isHandlingRefreshError = false;
}
