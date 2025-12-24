import { BaseService } from './base.service'
import { API_ENDPOINTS } from '@/utils/api'
import type { Project, ProjectGridResponse, ProjectCategory, CreateProjectRequest } from '@/types/project'

export class ProjectService extends BaseService {
  /**
   * Get project grid
   */
  async getProjects(options?: {
    search?: string
    pagination?: { start: number, number: number }
    sort?: { field: string, reverse: boolean }
  }) {
    const body = this.createListRequestBody({
      pagination: options?.pagination,
      search: {
        Name: options?.search || null
      },
      sort: options?.sort || { field: 'Id', reverse: false }
    })
    
    return this.post<ProjectGridResponse>(
      API_ENDPOINTS.PROJECTS_GRID,
      body
    )
  }

  /**
   * Get all project categories
   */
  async getCategories() {
    return this.get<ProjectCategory[]>(API_ENDPOINTS.PROJECT_CATEGORIES)
  }

  /**
   * Create new project
   */
  async createProject(data: CreateProjectRequest) {
    return this.post<any>(API_ENDPOINTS.PROJECT_CREATE, data)
  }

  /**
   * Get project by id
   */
  async getProject(id: number) {
    return this.get<Project>(API_ENDPOINTS.PROJECT_BY_ID(id))
  }

  /**
   * Update project
   */
  async updateProject(id: number, data: CreateProjectRequest) {
    return this.put<any>(API_ENDPOINTS.PROJECT_UPDATE(id), { ...data, id })
  }

  async deleteCategory(id: number) {
     // Assuming HttpDelete is standard here
     return this.delete(API_ENDPOINTS.PROJECT_CATEGORY_DELETE(id))
  }

  /**
   * Create project category
   */
  async createCategory(data: Partial<ProjectCategory>) {
    return this.post<ProjectCategory>(API_ENDPOINTS.PROJECT_CATEGORIES, data)
  }

  /*
   * Get category by id
   */
  async getCategory(id: number) {
      // Assuming backend supports singular get or filter
      // If no ID specific endpoint, might need to filter list (inefficient but fallback)
      // Or use the one I guessed: PROJECT_CATEGORY_BY_ID ??
      // Let's assume standard REST: /Project/categories/{id}
      // I need to add this endpoint to api.ts too if not exists
      return this.get<ProjectCategory>(`${API_ENDPOINTS.PROJECT_CATEGORIES}/${id}`)
  }

  /*
   * Update category
   */
  async updateCategory(id: number, data: Partial<ProjectCategory>) {
      return this.put<ProjectCategory>(`${API_ENDPOINTS.PROJECT_CATEGORIES}/${id}`, data)
  }
}

export const projectService = new ProjectService()
