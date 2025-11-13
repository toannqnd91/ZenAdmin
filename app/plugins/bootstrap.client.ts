// Note: dynamically import API to support both default and named exports

export default defineNuxtPlugin(async () => {
  const ready = useState('bootstrapReady', () => false)
  if (ready.value) return

  const settingsState = useState<any>('settings', () => null)
  const permissionsState = useState<any>('permissions', () => null)

  // TẠM THỜI FAKE API cho tới khi có endpoint thật
  // Đặt = false khi đã có API thật
  const USE_MOCK = true

  const overlayId = 'bootstrap-loading-overlay'
  const styleId = 'bootstrap-loading-style'

  const ensureStyle = () => {
    if (document.getElementById(styleId)) return
    const style = document.createElement('style')
    style.id = styleId
    style.innerHTML = `
      #${overlayId} { position: fixed; inset: 0; z-index: 999999; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.9); }
      #${overlayId} .box { text-align: center; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, sans-serif; color: #334155; }
      #${overlayId} .spinner { width: 40px; height: 40px; border: 3px solid #e5e7eb; border-top-color: #2563eb; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 12px; }
      #${overlayId} .btn { display: inline-block; margin-top: 12px; background: #2563eb; color: #fff; padding: 8px 12px; border-radius: 6px; cursor: pointer; border: none; }
      #${overlayId} .err { color: #dc2626; margin-top: 8px; }
      @keyframes spin { to { transform: rotate(360deg); } }
    `
    document.head.appendChild(style)
  }

  const mountOverlay = (errorMessage?: string) => {
    ensureStyle()
    let el = document.getElementById(overlayId)
    if (!el) {
      el = document.createElement('div')
      el.id = overlayId
      document.body.appendChild(el)
    }
    el.innerHTML = `
      <div class="box">
        <div class="spinner"></div>
        <div>${errorMessage ? 'Không thể tải dữ liệu khởi tạo' : 'Đang tải dữ liệu hệ thống…'}</div>
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
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 600))
      settingsState.value = {
        appName: 'Zen Admin',
        locale: 'vi',
        currency: 'VND',
        theme: 'light',
      }
      permissionsState.value = [
        'dashboard:view',
        'products:view',
        'products:create',
        'brands:view',
      ]
      return
    }

    const mod: any = await import('~/utils/api')
    const http: any = mod?.default ?? mod?.api ?? mod?.http ?? mod?.client ?? mod

    const [settingsRes, permissionsRes] = await Promise.all([
      http.get('/settings'),
      http.get('/permissions'),
      // Thêm API thứ 3 nếu có: http.get('/something-else')
    ])
    settingsState.value = settingsRes.data
    permissionsState.value = permissionsRes.data
  }

  // Loop cho tới khi thành công (cho phép retry khi lỗi)
  // Hiển thị overlay ngay lập tức trước khi gọi API
  mountOverlay()

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await fetchAll()
      try {
        const { accessToken } = useAuthService()
        if (accessToken.value) {
          const { fetchMenu } = useDashboard()
          await fetchMenu()
        }
      } catch (e) {
        console.warn('Failed to fetch dashboard menu during bootstrap:', e)
      }
      ready.value = true
      unmountOverlay()
      break
    } catch (e: any) {
      const message = e?.response?.data?.message || e?.message || 'Lỗi không xác định'
      const el = mountOverlay(message)
      await new Promise<void>((resolve) => {
        const btn = el.querySelector('#bootstrap-retry') as HTMLButtonElement | null
        if (btn) {
          btn.addEventListener('click', () => resolve(), { once: true })
        } else {
          // Nếu không có nút (trường hợp không mong muốn), tự resolve sau 2s
          setTimeout(() => resolve(), 2000)
        }
      })
    }
  }
})

