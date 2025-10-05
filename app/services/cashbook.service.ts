import { BaseService } from './base.service'
import { API_ENDPOINTS } from '@/utils/api'

// Cash Book (Sổ quỹ) API types
export interface CashBookFilterRequest {
  from: string // ISO datetime
  to: string // ISO datetime
  type: number // CashBookTypeEnum (1=Thu,2=Chi,0=All)
  method: number // CashBookMethodEnum (1=Tiền mặt,2=Chuyển khoản,3=Ví điện tử,0=All)
  status: number // CashBookStatusEnum (1=Đã hạch toán/hoàn thành?,2=Hủy,0=All) - based on description
  page: number
  pageSize: number
  keyword: string
  documentKinds: string[]
}

export interface CashBookItem {
  code: string
  occurredOn: string
  createdById: string
  type: number
  method: number
  amount: number
  description: string
  category: string
  partyType: string
  partyId: string | null
  partyName: string
  referenceModule: string | null
  referenceId: string | null
  orderId: number | null
  branchId: number | null
  status: number
  affectBusinessResult: boolean
  id: number
}

export interface CashBookPaginationInfo {
  page: number
  pageSize: number
  total: number
}

export interface MethodBreakdownEntry {
  method: number
  thu: number
  chi: number
  net: number
}

export interface DocumentKindBreakdown {
  thuTienMat: number
  chiTienMat: number
  netTienMat: number
  thuTKNH: number
  chiTKNH: number
  netTKNH: number
  transferIn: number
  transferOut: number
  transferNet: number
}

export interface CashBookResponseData {
  items: CashBookItem[]
  pagination: CashBookPaginationInfo
  openingBalance: number
  totalIn: number
  totalOut: number
  net: number
  closingBalance: number
  methodBreakdown: MethodBreakdownEntry[]
  documentKindBreakdown: DocumentKindBreakdown
}

export interface CashBookApiResponse {
  code: string
  success: boolean
  message: string
  data: CashBookResponseData
}

class CashBookService extends BaseService {
  async filter(request: CashBookFilterRequest): Promise<CashBookResponseData> {
    const res = await this.post<CashBookResponseData>(API_ENDPOINTS.CASHBOOK_FILTER, request)
    // API envelope already parsed by BaseService; ensure success
    return res.data
  }

  async getByCode(code: string) {
    // Endpoint pattern: /cashbook/{code}
    const endpoint = API_ENDPOINTS.CASHBOOK_DETAIL(code)
    return this.get<unknown>(endpoint)
  }
}

export const cashBookService = new CashBookService()
export type { CashBookService }
