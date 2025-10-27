import { useState, useCookie } from '#imports'

export interface SelectedWarehouse {
  id: number | string | null
  name: string
}

export function useGlobalWarehouse() {
  const selectedWarehouse = useState<SelectedWarehouse | null>('global-warehouse', () => {
    try {
      const idCookie = useCookie<string | null>('warehouse_id')
      const nameCookie = useCookie<string | null>('warehouse_name')
      if (idCookie.value && idCookie.value !== 'null' && idCookie.value !== 'undefined') {
        return { id: idCookie.value, name: nameCookie.value || '' }
      }
    } catch {
      // ignore cookie read errors
    }
    return null
  })

  function setWarehouse(w: SelectedWarehouse | null) {
    selectedWarehouse.value = w
    try {
      const idCookie = useCookie<string | null>('warehouse_id')
      const nameCookie = useCookie<string | null>('warehouse_name')
      if (w && w.id !== null && w.id !== undefined && String(w.id).trim() !== '') {
        idCookie.value = String(w.id)
        nameCookie.value = w.name || ''
      } else {
        idCookie.value = null
        nameCookie.value = null
      }
    } catch {
      // ignore cookie write errors
    }
  }

  function clearWarehouse() {
    setWarehouse(null)
  }

  return { selectedWarehouse, setWarehouse, clearWarehouse }
}
