export interface Admission {
  code: string
  title: string
  description: string
  startDate: string
  endDate: string
  resultAnnouncement: string
  statusText: string | null
  admissionType: number
  admissionYear: number
  sortOrder: number
  isActive: boolean
  id: number
}
