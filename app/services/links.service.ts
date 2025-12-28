import { BaseService } from './base.service'
import { API_ENDPOINTS } from '@/utils/api'

export interface MenuItem {
  id: number
  title: string
  url: string
  icon: string | null
  order: number
  sortOrder?: number
  isActive?: boolean
  parentId?: number
  parent?: MenuItem | null
  menuCategoryId?: number
  children: MenuItem[]
  menuType?: {
    id: number
    name: string
    entity: string | null
    entityId?: number
  } | null
  menuTypeId?: number
  entityId?: number
  autoGenerateChildren?: boolean
  dynamicConfig?: string | null
}

export interface LinkData {
  id?: number
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

export interface UpdateMenuRequest {
  title: string
  url: string
  icon?: string
  sortOrder?: number
  isActive?: boolean
  parentId?: number
  menuCategoryId?: number
  menuTypeId?: number
  entityId?: number
  autoGenerateChildren?: boolean
  dynamicConfig?: string
}

export interface CreateMenuRequest {
  title: string
  url: string
  icon?: string
  isActive: boolean
  parentId?: number
  menuCategoryId: number
  menuTypeId?: number
  entityId?: number
  autoGenerateChildren?: boolean
  dynamicConfig?: string
}

export interface MenuCategory {
  id: number
  name: string
  url: string
  description: string
  isSystem: boolean
  sortOrder: number
}

export class LinksService extends BaseService {
  /**
   * Get all links
   */
  async getLinks() {
    return this.get<LinkData[]>(API_ENDPOINTS.LINKS)
  }

  /**
   * Get single link by URL
   */
  async getLinkByUrl(url: string) {
    return this.get<LinkData>(API_ENDPOINTS.LINK_BY_URL(url))
  }

  /**
   * Create new link
   */
  async createLink(data: CreateLinkRequest) {
    return this.post<LinkData>(API_ENDPOINTS.LINKS, data)
  }

  /**
   * Update link
   */
  async updateLink(url: string, data: UpdateLinkRequest) {
    return this.put<LinkData>(API_ENDPOINTS.LINK_BY_URL(url), data)
  }

  /**
   * Delete link
   */
  async deleteLink(url: string) {
    return this.delete(API_ENDPOINTS.LINK_BY_URL(url))
  }

  /**
   * Get menu items for a specific link
   */
  async getMenuItems(linkUrl: string) {
    return this.get<MenuItem[]>(API_ENDPOINTS.LINK_MENU_ITEMS(linkUrl))
  }

  /**
   * Get menu categories by URL (for the new API endpoint)
   */
  async getMenuCategories(menuUrl: string) {
    return this.get<MenuItem[]>(API_ENDPOINTS.MENU_CATEGORIES(menuUrl))
  }

  /**
   * Create new menu item
   */
  async createMenuItem(data: CreateMenuItemRequest) {
    return this.post<MenuItem>(API_ENDPOINTS.LINK_MENU_ITEMS(data.parentUrl), data)
  }

  /**
   * Update menu item
   */
  async updateMenuItem(linkUrl: string, data: UpdateMenuItemRequest) {
    return this.put<MenuItem>(API_ENDPOINTS.LINK_MENU_ITEM_BY_ID(linkUrl, data.id), data)
  }

  /**
   * Update menu item (New API)
   */
  async updateMenu(id: number, data: UpdateMenuRequest) {
    return this.put<unknown>(API_ENDPOINTS.MENU_UPDATE(id), data)
  }

  /**
   * Create new menu item (New API)
   */
  async createMenu(data: CreateMenuRequest) {
    return this.post<MenuItem>(API_ENDPOINTS.MENU_CREATE, data)
  }

  /**
   * Delete menu item (New API)
   */
  async deleteMenu(id: number) {
    return this.delete(API_ENDPOINTS.MENU_DELETE(id))
  }

  /**
   * Get menu category by slug
   */
  async getMenuCategoryBySlug(slug: string) {
    return this.get<MenuCategory>(API_ENDPOINTS.MENU_CATEGORY_BY_SLUG(slug))
  }

  /**
   * Delete menu item
   */
  async deleteMenuItem(linkUrl: string, itemId: number) {
    return this.delete(API_ENDPOINTS.LINK_MENU_ITEM_BY_ID(linkUrl, itemId))
  }

  /**
   * Reorder menu items (old, keep for backward compatibility)
   */
  async reorderMenuItems(linkUrl: string, items: { id: number, order: number }[]) {
    return this.put<MenuItem[]>(API_ENDPOINTS.LINK_MENU_ITEMS_REORDER(linkUrl), { items })
  }

  /**
   * Reorder menu items (new API)
   * POST /Menus/reorder
   * Body: { items: [{ menuId, parentId, sortOrder }] }
   * - parentId: 0 for root-level
   */
  async reorderMenuItemsV2(items: Array<{ menuId: number, parentId: number | null, sortOrder: number }>) {
    const payload = {
      items: items.map(it => ({
        menuId: Number(it.menuId),
        parentId: it.parentId == null ? 0 : Number(it.parentId),
        sortOrder: Number(it.sortOrder)
      }))
    }
    return this.post<unknown>(API_ENDPOINTS.MENU_REORDER, payload)
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
