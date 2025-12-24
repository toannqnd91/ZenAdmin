export interface Project {
  id: number
  name: string
  description: string | null
  content: string | null
  status: string | null
  imageUrl: string | null
  thumbnailUrl: string | null
  slug: string | null
  location: string | null
  startDate: string | null
  endDate: string | null
  clientName: string | null
  budget: number | null
  displayOrder: number
  isFeatured: boolean
  isPublished: boolean
  viewCount: number
  createdDate: string
  metaTitle: string | null
  metaDescription: string | null
  metaKeywords: string | null
  categories: any[]
}

export interface ProjectGridRequest {
  Pagination: {
    Start: number
    TotalItemCount: number
    Number: number
    NumberOfPages: number
  }
  Search: {
    QueryObject: {
      Name: string | null
    }
  }
  Sort: {
    Field: string
    Reverse: boolean
  }
}

export interface ProjectGridResponse {
  items: Project[]
  totalRecord: number
  numberOfPages: number
}

export interface ProjectCategory {
  id: number
  name: string
  slug: string
  description: string | null
  displayOrder: number
  isActive: boolean
}

export interface CreateProjectRequest {
  name: string
  description: string
  content: string
  status: string
  imageUrl: string
  thumbnailUrl: string
  slug: string
  location: string
  startDate: string | null
  endDate: string | null
  clientName: string
  budget: number
  displayOrder: number
  isFeatured: boolean
  isPublished: boolean
  metaTitle: string
  metaDescription: string
  metaKeywords: string
  categoryIds: number[]
}
export interface UpdateProjectRequest extends CreateProjectRequest {
  id: number
}
