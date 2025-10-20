export interface Scholarship {
  id: number
  code: string
  name: string
  description: string
  isActive: boolean
  criterias: ScholarshipCriteria[]
}

export interface ScholarshipCriteria {
  id: number
  description: string
  isActive: boolean
}
