export default defineNuxtRouteMiddleware((to) => {
  // Skip auth check for login and signup pages
  if (to.path === '/login' || to.path === '/signup') {
    return
  }

  const encodedToken = useCookie<string | null>('access_token').value
  
  if (!encodedToken) {
    return navigateTo('/login')
  }

  // Check if token cookie exists
  // Note: Token is encrypted, so we cannot validate JWT structure here
  // Real validation happens in bootstrap/services
  if (!encodedToken) {
    return navigateTo('/login')
  }
})
