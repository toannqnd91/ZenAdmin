/**
 * Bootstrap Plugin - Dark Modern Loading Screen
 * Tải trước tất cả dữ liệu cần thiết khi khởi động ứng dụng
 */

export default defineNuxtPlugin(async (nuxtApp) => {
  // Skip bootstrap on server
  if (import.meta.server) return

  const ready = useState('bootstrapReady', () => false)
  if (ready.value) return

  const overlayId = 'bootstrap-loading-overlay'
  const styleId = 'bootstrap-loading-style'

  const ensureStyle = () => {
    if (document.getElementById(styleId)) return
    const style = document.createElement('style')
    style.id = styleId
    style.innerHTML = `
      #${overlayId} { 
        position: fixed; 
        inset: 0; 
        z-index: 999999; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        background: #0f172a;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      #${overlayId} .box { 
        text-align: center; 
        max-width: 480px;
        width: 100%;
        padding: 2rem;
      }
      
      #${overlayId} .logo-wrapper {
        margin-bottom: 3.5rem;
      }
      
      #${overlayId} .logo {
        font-size: 2.5rem;
        font-weight: 700;
        margin-bottom: 0.75rem;
        letter-spacing: -0.02em;
        color: #f1f5f9;
      }
      
      #${overlayId} .logo-highlight {
        color: #10b981;
      }
      
      #${overlayId} .logo-subtitle {
        font-size: 0.875rem;
        color: #64748b;
        font-weight: 500;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }
      
      #${overlayId} .progress-section {
        margin-bottom: 2rem;
      }
      
      #${overlayId} .progress-container {
        width: 100%;
        height: 3px;
        background: #1e293b;
        border-radius: 3px;
        overflow: hidden;
        margin: 0 auto 1rem;
        position: relative;
      }
      
      #${overlayId} .progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #10b981, #059669);
        border-radius: 3px;
        transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        width: 0%;
        box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
      }
      
      #${overlayId} .progress-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.75rem;
        color: #64748b;
        font-weight: 500;
      }
      
      #${overlayId} .message {
        font-size: 0.95rem;
        color: #cbd5e1;
        margin-bottom: 0.5rem;
        font-weight: 500;
      }
      
      #${overlayId} .step-description {
        font-size: 0.8rem;
        color: #64748b;
        font-weight: 400;
      }
      
      #${overlayId} .spinner {
        display: inline-block;
        width: 12px;
        height: 12px;
        border: 2px solid #1e293b;
        border-top-color: #10b981;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin-left: 0.5rem;
        vertical-align: middle;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      #${overlayId} .btn { 
        display: inline-block; 
        margin-top: 2rem; 
        background: #10b981; 
        color: #0f172a; 
        padding: 0.75rem 2rem; 
        border-radius: 6px; 
        cursor: pointer; 
        border: none; 
        font-weight: 600;
        font-size: 0.9rem;
        transition: all 0.2s;
      }
      
      #${overlayId} .btn:hover {
        background: #059669;
        transform: translateY(-1px);
      }
      
      #${overlayId} .err { 
        color: #fca5a5; 
        background: #7f1d1d;
        margin-top: 1rem; 
        padding: 0.75rem 1rem;
        border-radius: 6px;
        font-size: 0.875rem;
        border-left: 3px solid #ef4444;
      }
    `
    document.head.appendChild(style)
  }

  const mountOverlay = (message: string = 'Loading your dashboard...', progressPercent: number = 0, stepDescription?: string, errorMessage?: string) => {
    ensureStyle()
    let el = document.getElementById(overlayId)
    if (!el) {
      el = document.createElement('div')
      el.id = overlayId
      document.body.appendChild(el)
    }
    el.innerHTML = `
      <div class="box">
        <div class="logo-wrapper">
          <div class="logo">Zen<span class="logo-highlight">Pos</span></div>
          <div class="logo-subtitle">Bán hàng chuyên nghiệp</div>
        </div>
        
        <div class="progress-section">
          <div class="progress-container">
            <div class="progress-bar" style="width: ${progressPercent}%"></div>
          </div>
          <div class="progress-info">
            <span>${stepDescription || 'Initializing...'}</span>
            <span>${progressPercent}%</span>
          </div>
        </div>
        
        <div class="message">
          ${message}
          ${!errorMessage ? '<span class="spinner"></span>' : ''}
        </div>
        
        ${errorMessage ? `<div class="err">${errorMessage}</div>` : ''}
        ${errorMessage ? `<button class="btn" id="bootstrap-retry">Thử lại</button>` : ''}
      </div>
    `
    return el
  }

  const unmountOverlay = () => {
    const el = document.getElementById(overlayId)
    if (el) el.remove()
    const st = document.getElementById(styleId)
    if (st) st.remove()
  }

  const fetchAll = async () => {
    // Step 1: Check authentication (0-25%)
    mountOverlay('Đang khởi động', 0, 'Kiểm tra xác thực')
    await new Promise(r => setTimeout(r, 200))
    
    const { accessToken, initialize } = useAuthService()
    initialize()
    
    // If not authenticated, skip bootstrap entirely
    if (!accessToken.value) {
      console.log('[Bootstrap] User not authenticated, skipping bootstrap')
      return false
    }

    mountOverlay('Đang tải cấu hình', 25, 'Tải menu dashboard')

    // Step 2: Load dashboard menu (25-50%)
    try {
      const { fetchMenu } = useDashboard()
      await fetchMenu()
    } catch (e) {
      console.warn('Failed to fetch dashboard menu during bootstrap:', e)
    }

    mountOverlay('Đang đồng bộ', 50, 'Tải danh sách kho hàng')

    // Step 3: Load warehouses (50-75%)
    try {
      const { warehouseService } = await import('@/services/warehouse.service')
      const warehousesResponse = await warehouseService.getWarehouses()
      
      const warehousesState = useState<any[]>('warehouses', () => [])
      warehousesState.value = (warehousesResponse as any).data || []

      const { selectedWarehouse, setWarehouse } = useGlobalWarehouse()
      if (!selectedWarehouse.value && warehousesState.value.length > 0) {
        const defaultWarehouse = warehousesState.value.find((w: any) => w.isDefault) || warehousesState.value[0]
        setWarehouse({
          id: defaultWarehouse.id,
          name: defaultWarehouse.name
        })
      }
    } catch (e) {
      console.warn('Failed to fetch warehouses during bootstrap:', e)
    }

    mountOverlay('Gần hoàn tất', 75, 'Chuẩn bị giao diện')
    await new Promise(r => setTimeout(r, 200))

    // Step 4: Complete (100%)
    mountOverlay('Hoàn tất', 100, 'Sẵn sàng')
    await new Promise(r => setTimeout(r, 300))
    
    return true
  }

  // Check if user is authenticated before showing overlay
  const { accessToken: initialToken } = useAuthService()
  
  const runBootstrap = async () => {
    // Show overlay
    mountOverlay()

    // Retry loop
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const success = await fetchAll()
        
        // If not authenticated, exit gracefully
        if (success === false) {
          unmountOverlay()
          ready.value = true
          break
        }
        
        ready.value = true
        unmountOverlay()
        break
      } catch (e: any) {
        const message = e?.message || 'Lỗi không xác định'
        
        // Show error and retry button
        const el = mountOverlay('Đã xảy ra lỗi', 0, undefined, message)
        await new Promise<void>((resolve) => {
          const btn = el.querySelector('#bootstrap-retry') as HTMLButtonElement | null
          if (btn) {
            btn.addEventListener('click', () => resolve(), { once: true })
          } else {
            setTimeout(() => resolve(), 2000)
          }
        })
      }
    }
  }
  
  // If already authenticated, run bootstrap immediately
  if (initialToken.value) {
    console.log('[Bootstrap] User authenticated, running bootstrap')
    await runBootstrap()
  } else {
    console.log('[Bootstrap] No token found, waiting for login')
    ready.value = true
    
    // Watch for login event
    const shouldRunBootstrap = useState('shouldRunBootstrap', () => false)
    watch(shouldRunBootstrap, async (newValue) => {
      if (newValue) {
        console.log('[Bootstrap] Login detected, running bootstrap')
        shouldRunBootstrap.value = false // Reset flag
        ready.value = false // Mark as not ready
        await runBootstrap()
      }
    })
  }
})
