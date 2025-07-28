export default defineNuxtPlugin(() => {
  const colorMode = useColorMode()
  const appConfig = useAppConfig()
  
  // Set theme from app.config.ts
  if (appConfig.colorMode?.preference) {
    colorMode.preference = appConfig.colorMode.preference
  }
})
