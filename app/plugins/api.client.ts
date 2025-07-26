// export default defineNuxtPlugin(() => {
//   const { $fetch } = useNuxtApp()

//   // Add token to all requests
//   $fetch.create({
//     onRequest({ request, options }) {
//       const authToken = useCookie('access_token')
//       if (authToken.value) {
//         options.headers = {
//           ...options.headers,
//           Authorization: `Bearer ${authToken.value}`
//         }
//       }
//     },
//     onResponseError({ response }) {
//       if (response.status === 401) {
//         // Clear token and redirect to login
//         const authToken = useCookie('access_token')
//         authToken.value = null
//         navigateTo('/login')
//       }
//     }
//   })
// })