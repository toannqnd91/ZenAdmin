export default defineNuxtPlugin(() => {
  if (import.meta.server) return

  // Wait for the DOM to be ready
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length) {
        setupPropertiesPanel()
      }
    }
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true
  })

  // Also try immediately in case it's already there
  setupPropertiesPanel()

  function setupPropertiesPanel() {
    // 1. Find the properties panel
    const panel = document.querySelector('.right-panel-floating') as HTMLElement
    if (!panel || panel.dataset.draggableInitialized) return

    // Mark as initialized to prevent double-setup
    panel.dataset.draggableInitialized = 'true'

    // 2. Find or Create Header elements
    const header = panel.querySelector('.panel-card-header') as HTMLElement
    if (!header) return

    // Styles for the panel to support absolute/fixed positioning
    panel.style.transition = 'none' // Disable transition for smooth dragging
    
    // Create state
    let isPinned = false
    let isDragging = false
    let startX = 0
    let startY = 0
    let initialLeft = 0
    let initialTop = 0

    // 3. Implement Dock/Pin Button
    const controls = header.querySelector('.panel-controls')
    if (controls) {
      // Create Pin Button
      const pinBtn = document.createElement('button')
      pinBtn.className = 'win-btn'
      pinBtn.title = 'Dock to Right'
      pinBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="15" y="3" width="6" height="18" rx="1" />
          <path d="M3 12h12" />
        </svg>
      `
      pinBtn.style.marginRight = '4px'
      pinBtn.style.cursor = 'pointer'
      pinBtn.style.display = 'inline-flex'
      pinBtn.style.alignItems = 'center'
      pinBtn.style.justifyContent = 'center'
      
      // Insert before the Close button (usually last)
      controls.insertBefore(pinBtn, controls.firstChild)

      // Pin Logic
      pinBtn.onclick = (e) => {
        e.stopPropagation()
        isPinned = !isPinned
        
        if (isPinned) {
          // Docked State
          panel.style.position = 'fixed'
          panel.style.right = '0'
          panel.style.top = '60px' // Assuming navbar height
          panel.style.bottom = '0'
          panel.style.left = 'auto'
          panel.style.height = 'auto'
          panel.style.transform = 'none'
          panel.style.borderRadius = '0'
          panel.style.borderRight = 'none'
          
          pinBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          `
          pinBtn.title = 'Undock (Float)'
          header.style.cursor = 'default'
        } else {
          // Floating State
          const rect = panel.getBoundingClientRect()
          panel.style.position = 'fixed'
          panel.style.right = 'auto'
          // Check if we need to reset positions or keep last known
          panel.style.left = (window.innerWidth - rect.width - 20) + 'px'
          panel.style.top = '80px'
          panel.style.bottom = 'auto'
          panel.style.height = 'auto' // Let content decide or specific height
          panel.style.borderRadius = ''
          panel.style.borderRight = ''
          
          pinBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="15" y="3" width="6" height="18" rx="1" />
              <path d="M3 12h12" />
            </svg>
          `
          pinBtn.title = 'Dock to Right'
          header.style.cursor = 'move'
        }
      }
    }

    // 4. Implement Drag Handle
    // Add visual handle icon to left of title
    const titleSpan = header.querySelector('.panel-title')
    if (titleSpan) {
       const dragIcon = document.createElement('span')
       dragIcon.innerHTML = `
         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="gray" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
           <circle cx="9" cy="12" r="1" />
           <circle cx="9" cy="5" r="1" />
           <circle cx="9" cy="19" r="1" />
           <circle cx="15" cy="12" r="1" />
           <circle cx="15" cy="5" r="1" />
           <circle cx="15" cy="19" r="1" />
         </svg>
       `
       header.insertBefore(dragIcon, titleSpan)
    }

    // Dragging Logic
    header.style.cursor = 'move'
    header.style.userSelect = 'none'

    header.addEventListener('mousedown', (e) => {
      if (isPinned) return
      // Don't drag if clicking buttons
      if ((e.target as HTMLElement).closest('button')) return

      isDragging = true
      startX = e.clientX
      startY = e.clientY
      
      const rect = panel.getBoundingClientRect()
      initialLeft = rect.left
      initialTop = rect.top

      // Ensure fixed positioning for dragging
      panel.style.position = 'fixed'
      panel.style.left = initialLeft + 'px'
      panel.style.top = initialTop + 'px'
      panel.style.right = 'auto'
      panel.style.bottom = 'auto'
      panel.style.margin = '0'
      
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    })

    function onMouseMove(e: MouseEvent) {
      if (!isDragging) return
      
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      
      panel.style.left = (initialLeft + dx) + 'px'
      panel.style.top = (initialTop + dy) + 'px'
    }

    function onMouseUp() {
      isDragging = false
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }
})
