export default defineNuxtRouteMiddleware((to) => {
  // Skip auth check for login and signup pages
  if (to.path === '/login' || to.path === '/signup') {
    return
  }

  const encodedToken = useCookie<string | null>('access_token').value
  
  if (!encodedToken) {
    return navigateTo('/login')
  }

  // Validate that token can be decoded (it's stored as base64)
  try {
    const decodedToken = import.meta.client ? atob(encodedToken) : Buffer.from(encodedToken, 'base64').toString('utf8')
    
    // Check if decoded token is a valid JWT (has 3 parts)
    if (!decodedToken || decodedToken.split('.').length !== 3) {
      return navigateTo('/login')
    }
  } catch {
    // If decode fails, token is invalid
    return navigateTo('/login')
  }
})
