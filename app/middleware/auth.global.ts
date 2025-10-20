// export default defineNuxtRouteMiddleware((to) => {
//   const { isLoggedIn } = useAuth()
//   if (!isLoggedIn.value && to.path !== '/login' && to.path !== '/signup') {
//     return navigateTo('/login')
//   }
// })

export default defineNuxtRouteMiddleware((to) => {
  const token = useCookie<string | null>('access_token').value
  if (!token && to.path !== '/login' && to.path !== '/signup') {
    return navigateTo('/login')
  }
})
