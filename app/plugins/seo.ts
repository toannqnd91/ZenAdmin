/**
 * SEO Plugin - Meta tags and structured data
 */

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  
  // Default SEO configuration
  const defaultSEO = {
    title: config.public.appTitle || 'Zen Admin Dashboard',
    description: 'Enterprise-grade Admin Dashboard built with Nuxt 4, Vue 3, and TypeScript',
    keywords: 'admin dashboard, nuxt, vue, typescript, enterprise',
    ogImage: '/og-image.png',
    twitterCard: 'summary_large_image'
  }

  // Set default meta tags
  nuxtApp.hook('app:mounted', () => {
    useSeoMeta({
      title: defaultSEO.title,
      description: defaultSEO.description,
      keywords: defaultSEO.keywords,
      ogTitle: defaultSEO.title,
      ogDescription: defaultSEO.description,
      ogImage: defaultSEO.ogImage,
      ogType: 'website',
      twitterCard: defaultSEO.twitterCard,
      twitterTitle: defaultSEO.title,
      twitterDescription: defaultSEO.description,
      twitterImage: defaultSEO.ogImage
    })
  })

  // Provide SEO helper
  return {
    provide: {
      seo: {
        setPageMeta: (meta: {
          title?: string
          description?: string
          keywords?: string
          ogImage?: string
          noindex?: boolean
        }) => {
          const fullTitle = meta.title 
            ? `${meta.title} | ${defaultSEO.title}`
            : defaultSEO.title

          useSeoMeta({
            title: fullTitle,
            description: meta.description || defaultSEO.description,
            keywords: meta.keywords || defaultSEO.keywords,
            ogTitle: fullTitle,
            ogDescription: meta.description || defaultSEO.description,
            ogImage: meta.ogImage || defaultSEO.ogImage,
            twitterTitle: fullTitle,
            twitterDescription: meta.description || defaultSEO.description,
            twitterImage: meta.ogImage || defaultSEO.ogImage,
            robots: meta.noindex ? 'noindex,nofollow' : 'index,follow'
          })
        },
        
        setStructuredData: (data: any) => {
          useHead({
            script: [
              {
                type: 'application/ld+json',
                children: JSON.stringify(data)
              }
            ]
          })
        }
      }
    }
  }
})
