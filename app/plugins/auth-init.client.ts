/**
 * Initialize authentication on app start (client-side only)
 * This ensures auth state is ready before any page loads
 */
export default defineNuxtPlugin(() => {
  const { initialize } = useAuthService()
  
  // Force initialize immediately
  initialize()
})
