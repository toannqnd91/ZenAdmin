/**
 * UI state store
 * Manages global UI state (sidebar, modals, notifications, etc.)
 */

import { defineStore } from 'pinia'

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

interface Modal {
  id: string
  component: string
  props?: Record<string, unknown>
}

interface UIState {
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  theme: 'light' | 'dark' | 'auto'
  notifications: Notification[]
  modals: Modal[]
  loading: boolean
  loadingMessage: string
}

export const useUIStore = defineStore('ui', {
  state: (): UIState => ({
    sidebarOpen: true,
    sidebarCollapsed: false,
    theme: 'light',
    notifications: [],
    modals: [],
    loading: false,
    loadingMessage: ''
  }),

  getters: {
    isSidebarOpen: (state) => state.sidebarOpen,
    isSidebarCollapsed: (state) => state.sidebarCollapsed,
    currentTheme: (state) => state.theme,
    hasNotifications: (state) => state.notifications.length > 0,
    hasModals: (state) => state.modals.length > 0,
    isLoading: (state) => state.loading
  },

  actions: {
    /**
     * Toggle sidebar
     */
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen
    },

    /**
     * Collapse/expand sidebar
     */
    toggleSidebarCollapse() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },

    /**
     * Set theme
     */
    setTheme(theme: 'light' | 'dark' | 'auto') {
      this.theme = theme
      // Persist to localStorage
      if (import.meta.client) {
        localStorage.setItem('theme', theme)
      }
    },

    /**
     * Add notification
     */
    addNotification(notification: Omit<Notification, 'id'>) {
      const id = `notification-${Date.now()}-${Math.random()}`
      const newNotification: Notification = {
        id,
        ...notification,
        duration: notification.duration || 5000
      }

      this.notifications.push(newNotification)

      // Auto-remove after duration
      if (newNotification.duration > 0) {
        setTimeout(() => {
          this.removeNotification(id)
        }, newNotification.duration)
      }

      return id
    },

    /**
     * Remove notification
     */
    removeNotification(id: string) {
      const index = this.notifications.findIndex(n => n.id === id)
      if (index > -1) {
        this.notifications.splice(index, 1)
      }
    },

    /**
     * Clear all notifications
     */
    clearNotifications() {
      this.notifications = []
    },

    /**
     * Open modal
     */
    openModal(component: string, props?: Record<string, unknown>) {
      const id = `modal-${Date.now()}`
      this.modals.push({ id, component, props })
      return id
    },

    /**
     * Close modal
     */
    closeModal(id: string) {
      const index = this.modals.findIndex(m => m.id === id)
      if (index > -1) {
        this.modals.splice(index, 1)
      }
    },

    /**
     * Close all modals
     */
    closeAllModals() {
      this.modals = []
    },

    /**
     * Show loading
     */
    showLoading(message = 'Loading...') {
      this.loading = true
      this.loadingMessage = message
    },

    /**
     * Hide loading
     */
    hideLoading() {
      this.loading = false
      this.loadingMessage = ''
    },

    /**
     * Initialize UI from localStorage
     */
    initializeUI() {
      if (import.meta.client) {
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'auto' | null
        if (savedTheme) {
          this.theme = savedTheme
        }

        const savedSidebarCollapsed = localStorage.getItem('sidebarCollapsed')
        if (savedSidebarCollapsed) {
          this.sidebarCollapsed = savedSidebarCollapsed === 'true'
        }
      }
    }
  }
})
