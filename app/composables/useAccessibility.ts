/**
 * Accessibility (a11y) Composable
 * WCAG 2.1 AA compliance utilities
 */

export const useAccessibility = () => {
  const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (process.client) {
      const announcement = document.createElement('div')
      announcement.setAttribute('role', 'status')
      announcement.setAttribute('aria-live', priority)
      announcement.setAttribute('aria-atomic', 'true')
      announcement.className = 'sr-only'
      announcement.textContent = message
      
      document.body.appendChild(announcement)
      
      setTimeout(() => {
        document.body.removeChild(announcement)
      }, 1000)
    }
  }

  const trapFocus = (element: HTMLElement) => {
    const focusableElements = element.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    
    const firstFocusable = focusableElements[0] as HTMLElement
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstFocusable) {
          e.preventDefault()
          lastFocusable.focus()
        } else if (!e.shiftKey && document.activeElement === lastFocusable) {
          e.preventDefault()
          firstFocusable.focus()
        }
      }
    }

    element.addEventListener('keydown', handleKeyDown)
    
    return () => {
      element.removeEventListener('keydown', handleKeyDown)
    }
  }

  const setDocumentTitle = (title: string) => {
    if (process.client) {
      document.title = title
      announceToScreenReader(`Đã chuyển đến trang: ${title}`)
    }
  }

  const skipToContent = () => {
    if (process.client) {
      const mainContent = document.getElementById('main-content')
      if (mainContent) {
        mainContent.setAttribute('tabindex', '-1')
        mainContent.focus()
        mainContent.removeAttribute('tabindex')
      }
    }
  }

  return {
    announceToScreenReader,
    trapFocus,
    setDocumentTitle,
    skipToContent
  }
}
