export interface DashboardMenuItem {
  id: number
  name: string
  icon: string | null
  url: string
  group: string | null
  permissions: string | null
  parentId: number | null
  note: string | null
  menuType: string | null
  children: DashboardMenuItem[] | null
}

export interface DashboardMenuResponse {
  code: string
  success: boolean
  message: string
  data: DashboardMenuItem[]
}