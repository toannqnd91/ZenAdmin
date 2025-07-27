import { BaseService } from './base.service'
import type { Admission } from '@/types/admission'
import type { Scholarship } from '@/types/scholarship'

export interface AdmissionApplication {
  id: number
  admissionId: number
  studentName: string
  email: string
  phone: string
  identityCard: string
  birthDate: string
  address: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export interface CreateAdmissionApplicationRequest {
  admissionId: number
  studentName: string
  email: string
  phone: string
  identityCard: string
  birthDate: string
  address: string
  documents?: string[] // File names/URLs
}

export class AdmissionService extends BaseService {
  /**
   * Get all admissions
   */
  async getAdmissions(options?: {
    search?: string
    year?: number
    type?: number
    isActive?: boolean
    pagination?: { start: number, number: number }
    sort?: { field: string, reverse: boolean }
  }) {
    const body = this.createListRequestBody({
      pagination: options?.pagination,
      search: {
        Title: options?.search || null,
        AdmissionYear: options?.year || null,
        AdmissionType: options?.type || null,
        IsActive: options?.isActive ?? null
      },
      sort: options?.sort
    })
    
    return this.post<Admission[]>('/Admissions', body)
  }

  /**
   * Get single admission by ID
   */
  async getAdmissionById(id: number) {
    return this.get<Admission>(`/Admissions/${id}`)
  }

  /**
   * Create admission application
   */
  async createApplication(data: CreateAdmissionApplicationRequest) {
    return this.post<AdmissionApplication>('/Admissions/applications', data)
  }

  /**
   * Get applications for an admission
   */
  async getApplications(admissionId: number, options?: {
    status?: string
    pagination?: { start: number, number: number }
  }) {
    const body = this.createListRequestBody({
      pagination: options?.pagination,
      search: {
        AdmissionId: admissionId,
        Status: options?.status || null
      }
    })
    
    return this.post<AdmissionApplication[]>('/Admissions/applications/list', body)
  }

  /**
   * Update application status
   */
  async updateApplicationStatus(applicationId: number, status: 'approved' | 'rejected') {
    return this.patch(`/Admissions/applications/${applicationId}/status`, { status })
  }
}

export class ScholarshipService extends BaseService {
  /**
   * Get all scholarships
   */
  async getScholarships(options?: {
    search?: string
    isActive?: boolean
    pagination?: { start: number, number: number }
    sort?: { field: string, reverse: boolean }
  }) {
    const body = this.createListRequestBody({
      pagination: options?.pagination,
      search: {
        Name: options?.search || null,
        IsActive: options?.isActive ?? null
      },
      sort: options?.sort
    })
    
    return this.post<Scholarship[]>('/Scholarships', body)
  }

  /**
   * Get single scholarship by ID
   */
  async getScholarshipById(id: number) {
    return this.get<Scholarship>(`/Scholarships/${id}`)
  }

  /**
   * Apply for scholarship
   */
  async applyScholarship(scholarshipId: number, data: {
    studentName: string
    email: string
    phone: string
    gpa: number
    essay: string
    documents?: string[]
  }) {
    return this.post(`/Scholarships/${scholarshipId}/applications`, data)
  }
}

// Export singleton instances
export const admissionService = new AdmissionService()
export const scholarshipService = new ScholarshipService()
