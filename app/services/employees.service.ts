import { BaseService } from './base.service'
import { API_ENDPOINTS } from '@/utils/api'

export interface EmployeeItem {
  code: string
  fullName: string
  email: string
  phoneNumber: string | null
  department: string | null
  position: string | null
  isActive: boolean
  userId: string
  createdOn: string | null
  createdById: string | null
  lastUpdatedOn: string | null
  lastUpdatedById: string | null
  id: number
}

export interface EmployeesResponse {
  code: string
  success: boolean
  message: string
  data: EmployeeItem[] | null
}

export class EmployeesService extends BaseService {
  private _cache: { data: EmployeeItem[], checksum: string, ts: number } | null = null

  private _sum(list: EmployeeItem[]) {
    try {
      return JSON.stringify(list.map(e => ({ id: e.id, email: e.email, fullName: e.fullName, isActive: e.isActive, dept: e.department, pos: e.position })))
    } catch {
      return ''
    }
  }

  async getEmployees() {
    return this.get<EmployeesResponse>(API_ENDPOINTS.EMPLOYEES)
  }

  async getEmployeesCached(opts?: { onUpdated?: (data: EmployeeItem[]) => void }): Promise<{ data: EmployeeItem[] | null, fromCache: boolean, refreshPromise?: Promise<boolean> }> {
    const cached = this._cache
    if (cached) {
      const refreshPromise = this.getEmployees()
        .then((res) => {
          // Normalize response for standard ApiResponse envelope
          const list = Array.isArray(res?.data) ? (res.data as EmployeeItem[]) : []
          const sum = this._sum(list)
          if (sum !== cached.checksum) {
            this._cache = { data: list, checksum: sum, ts: Date.now() }
            opts?.onUpdated?.(list)
            return true
          }
          return false
        })
        .catch(() => false)
      return { data: cached.data, fromCache: true, refreshPromise }
    }
    const res = await this.getEmployees()
    const list = Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.data) ? res.data!.data! : []
    this._cache = { data: list, checksum: this._sum(list), ts: Date.now() }
    return { data: list, fromCache: false }
  }
}

export const employeesService = new EmployeesService()
