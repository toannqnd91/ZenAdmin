import { BaseService } from './base.service'

export interface MenuItem {
  id: number
  title: string
  url: string
  icon: string | null
  order: number
  children: MenuItem[]
}

export interface LinkData {
  name: string
  url: string
  description: string
  isSystem: boolean
  sortOrder: number
  menuItems: MenuItem[]
}

export interface LinksListResponse {
  data: LinkData[]
}

export interface CreateLinkRequest {
  name: string
  url: string
  description: string
  isSystem?: boolean
  sortOrder: number
}

export interface UpdateLinkRequest extends Partial<CreateLinkRequest> {
  url: string // URL is used as identifier
}

export interface CreateMenuItemRequest {
  title: string
  url: string
  icon?: string
  order: number
  parentUrl: string // The link URL this menu item belongs to
}

export interface UpdateMenuItemRequest extends Partial<CreateMenuItemRequest> {
  id: number
}

export class LinksService extends BaseService {
  /**
   * Get all links
   */
  async getLinks() {
    return this.get<LinkData[]>('/Links')
  }

  /**
   * Get single link by URL
   */
  async getLinkByUrl(url: string) {
    return this.get<LinkData>(`/Links/${url}`)
  }

  /**
   * Create new link
   */
  async createLink(data: CreateLinkRequest) {
    return this.post<LinkData>('/Links', data)
  }

  /**
   * Update link
   */
  async updateLink(url: string, data: UpdateLinkRequest) {
    return this.put<LinkData>(`/Links/${url}`, data)
  }

  /**
   * Delete link
   */
  async deleteLink(url: string) {
    return this.delete(`/Links/${url}`)
  }

  /**
   * Get menu items for a specific link
   */
  async getMenuItems(linkUrl: string) {
    return this.get<MenuItem[]>(`/Links/${linkUrl}/MenuItems`)
  }

  /**
   * Get menu categories by URL (for the new API endpoint)
   */
  async getMenuCategories(menuUrl: string) {
    return this.get<MenuItem[]>(`/Menus/${menuUrl}/category`)
  }

  /**
   * Create new menu item
   */
  async createMenuItem(data: CreateMenuItemRequest) {
    return this.post<MenuItem>(`/Links/${data.parentUrl}/MenuItems`, data)
  }

  /**
   * Update menu item
   */
  async updateMenuItem(linkUrl: string, data: UpdateMenuItemRequest) {
    return this.put<MenuItem>(`/Links/${linkUrl}/MenuItems/${data.id}`, data)
  }

  /**
   * Delete menu item
   */
  async deleteMenuItem(linkUrl: string, itemId: number) {
    return this.delete(`/Links/${linkUrl}/MenuItems/${itemId}`)
  }

  /**
   * Reorder menu items (old, keep for backward compatibility)
   */
  async reorderMenuItems(linkUrl: string, items: { id: number, order: number }[]) {
    return this.put<MenuItem[]>(`/Links/${linkUrl}/MenuItems/reorder`, { items })
  }

  /**
   * Reorder menu items (new API)
   * POST /Menus/reorder { menuId, itemId, newParentId, newSortOrder }
   */
  async reorderMenuItemsV2(menuId: number, itemId: number, newParentId: number | null, newSortOrder: number) {
    return this.post<any>(`/Menus/reorder`, {
      menuId,
      itemId,
      newParentId,
      newSortOrder
    })
  }

  /**
   * Get menu items by link URL for display
   */
  async getMenuItemsForDisplay(linkUrl: string): Promise<MenuItem[]> {
    const response = await this.getLinkByUrl(linkUrl)
    if (response.success && response.data) {
      return response.data.menuItems || []
    }
    return []
  }
}

// Export singleton instance
export const linksService = new LinksService()
