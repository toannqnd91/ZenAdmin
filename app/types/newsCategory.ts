export interface NewsCategory {
  id: number
  name: string
  description: string
  imageUrl: string | null
  icon: string | null
  isDeleted: boolean
  url: string
  categories: NewsCategory[]
}

export interface NewsCategoriesApiResponse {
  code: string
  success: boolean
  message: string
  data: NewsCategory[]
}
