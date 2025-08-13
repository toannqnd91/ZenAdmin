export interface TableColumnLayout {
  width?: string
  minWidth?: string
  flex?: boolean
}

export interface TableLayoutConfig {
  [key: string]: TableColumnLayout
}

// Cấu hình layout chung cho các loại bảng
export const tableLayouts = {
  // Layout cho bảng có cột tên + ảnh (products, collections, categories)
  nameWithImage: {
    name: { flex: true, minWidth: '220px' },
    status: { width: '110px' },
    source: { width: '110px' },
    sold: { width: '80px' },
    inventory: { width: '110px' },
    description: { width: '200px' },
    isPublished: { width: '110px' },
    createdOn: { width: '120px' }
  },

  // Layout cho bảng đơn giản (news, widgets)
  simple: {
    name: { flex: true, minWidth: '200px' },
    title: { flex: true, minWidth: '200px' },
    category: { width: '120px' },
    status: { width: '100px' },
    publishDate: { width: '120px' },
    createdOn: { width: '120px' }
  }
}

export const useTableLayout = () => {
  // Tạo class CSS từ cấu hình layout
  const getColumnClass = (
    column: { key: string; class?: string },
    layout?: TableLayoutConfig
  ): string => {
    const baseClass = column.class || 'py-3 text-left font-medium'
    
    if (!layout || !layout[column.key]) {
      return baseClass
    }

    const layoutConfig = layout[column.key]
    const layoutClasses: string[] = []

    if (layoutConfig && layoutConfig.flex) {
      layoutClasses.push('flex-1')
    }
    if (layoutConfig && layoutConfig.width) {
      layoutClasses.push(`w-[${layoutConfig.width}]`)
    }
    if (layoutConfig && layoutConfig.minWidth) {
      layoutClasses.push(`min-w-[${layoutConfig.minWidth}]`)
    }

    return `${baseClass} ${layoutClasses.join(' ')}`
  }

  // Áp dụng layout cho danh sách columns
  const applyLayout = (
    columns: Array<{ key: string; label: string; class?: string }>,
    layoutType: keyof typeof tableLayouts
  ) => {
    const layout = tableLayouts[layoutType]
    return columns.map(column => ({
      ...column,
      class: getColumnClass(column, layout)
    }))
  }

  return {
    tableLayouts,
    getColumnClass,
    applyLayout
  }
}
