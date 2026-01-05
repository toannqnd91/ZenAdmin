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
  // Check if token is a valid JWT (has 3 parts)
  if (!encodedToken || encodedToken.split('.').length !== 3) {
    return navigateTo('/login')
  }
})
