<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'

// Import main components
import PosHeader from '~/components/pos/PosHeader.vue'
import PosFooter from '~/components/pos/PosFooter.vue'
import OrderSelector from '~/components/pos/OrderSelector.vue'

// Import modal components
import PaymentModal from '~/components/pos/modals/PaymentModal.vue'
import DiscountModal from '~/components/pos/modals/DiscountModal.vue'
import ProductNoteModal from '~/components/pos/modals/ProductNoteModal.vue'
import OrderNoteModal from '~/components/pos/modals/OrderNoteModal.vue'
import AddCustomerModal from '~/components/pos/modals/AddCustomerModal.vue'
import CustomProductModal from '~/components/pos/modals/CustomProductModal.vue'
import ProductSelectorModal from '~/components/pos/modals/ProductSelectorModal.vue'


definePageMeta({ layout: false })


// --- Types ---
interface Product {
  id: number
  sku: string
  name: string
  price: number
  imageUrl: string
  category: string
}

interface CartItem extends Product {
  quantity: number
  note?: string
  isReturn?: boolean
  maxReturnQty?: number
  originalOrderId?: number
}

interface PosTab {
  id: number
  label: string
}

interface Customer {
  id: number
  name: string
  phone: string
  address?: string
  level: 'Member' | 'VIP' | 'Diamond'
  points: number
}

// --- State ---
const searchQuery = ref('')
const activeTabId = ref<number>(1)
let tabIdCounter = 2

// View Mode: 'sales' (Product Grid) | 'return' (Order List)
const viewMode = ref<'sales' | 'return'>('sales')

const tabs = ref<PosTab[]>([
  { id: 1, label: 'Đơn #1' }
])


// --- Mock Data: Products ---
const products = ref<Product[]>([
  // Cà phê
  { id: 1, sku: 'CF001', name: 'Cà phê đen đá', price: 25000, category: 'Cà phê', imageUrl: 'https://images.unsplash.com/photo-1559496417-e7f25cb247f3?w=400&q=80' },
  { id: 2, sku: 'CF002', name: 'Cà phê sữa đá', price: 29000, category: 'Cà phê', imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&q=80' },
  { id: 3, sku: 'CF003', name: 'Bạc xỉu', price: 32000, category: 'Cà phê', imageUrl: 'https://images.unsplash.com/photo-1585849834997-6a1b2d77d13e?w=400&q=80' },
  { id: 4, sku: 'CF004', name: 'Espresso', price: 35000, category: 'Cà phê', imageUrl: 'https://images.unsplash.com/photo-1510591509098-f40718131299?w=400&q=80' },
  { id: 5, sku: 'CF005', name: 'Latte', price: 45000, category: 'Cà phê', imageUrl: 'https://images.unsplash.com/photo-1570968992193-6e5c9f506821?w=400&q=80' },
  { id: 6, sku: 'CF006', name: 'Capuchino', price: 45000, category: 'Cà phê', imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&q=80' },
  { id: 7, sku: 'CF007', name: 'Americano', price: 35000, category: 'Cà phê', imageUrl: 'https://images.unsplash.com/photo-1551030173-122f5236b5ec?w=400&q=80' },

  // Trà & Trà Sữa
  { id: 20, sku: 'TS001', name: 'Trà đào cam sả', price: 45000, category: 'Trà', imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80' },
  { id: 21, sku: 'TS002', name: 'Trà vải hạt sen', price: 45000, category: 'Trà', imageUrl: 'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?w=400&q=80' },
  { id: 22, sku: 'TS003', name: 'Trà chanh mật ong', price: 35000, category: 'Trà', imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=80' },
  { id: 23, sku: 'TS004', name: 'Trà sữa trân châu', price: 42000, category: 'Trà sữa', imageUrl: 'https://images.unsplash.com/photo-1558160074-4d7d8bdf4256?w=400&q=80' },
  { id: 24, sku: 'TS005', name: 'Trà sữa matcha', price: 45000, category: 'Trà sữa', imageUrl: 'https://images.unsplash.com/photo-1563822249548-9a72b6353cd1?w=400&q=80' },
  { id: 25, sku: 'TS006', name: 'Trà sữa khoai môn', price: 45000, category: 'Trà sữa', imageUrl: 'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?w=400&q=80' },
  { id: 26, sku: 'TS007', name: 'Hồng trà kem cheese', price: 48000, category: 'Trà sữa', imageUrl: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=400&q=80' },

  // Sinh tố & Nước ép
  { id: 40, sku: 'F001', name: 'Nước ép cam', price: 45000, category: 'Nước ép', imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400&q=80' },
  { id: 41, sku: 'F002', name: 'Nước ép táo', price: 45000, category: 'Nước ép', imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400&q=80' },
  { id: 42, sku: 'F003', name: 'Nước ép dưa hấu', price: 40000, category: 'Nước ép', imageUrl: 'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?w=400&q=80' },
  { id: 43, sku: 'ST001', name: 'Sinh tố bơ', price: 55000, category: 'Sinh tố', imageUrl: 'https://images.unsplash.com/photo-1598462058440-ad81f147983c?w=400&q=80' },
  { id: 44, sku: 'ST002', name: 'Sinh tố xoài', price: 50000, category: 'Sinh tố', imageUrl: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400&q=80' },
  { id: 45, sku: 'ST003', name: 'Sinh tố dâu', price: 52000, category: 'Sinh tố', imageUrl: 'https://images.unsplash.com/photo-1629528146389-122e17627448?w=400&q=80' },

  // Đồ ăn & Bánh
  { id: 60, sku: 'CK001', name: 'Bánh Croissant', price: 29000, category: 'Bánh', imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80' },
  { id: 61, sku: 'CK002', name: 'Bánh Tiramisu', price: 45000, category: 'Bánh', imageUrl: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=400&q=80' },
  { id: 62, sku: 'CK003', name: 'Bánh Mousse Chanh Leo', price: 42000, category: 'Bánh', imageUrl: 'https://images.unsplash.com/photo-1542826438-bd32f43d626f?w=400&q=80' },
  { id: 63, sku: 'SN001', name: 'Hạt hướng dương', price: 15000, category: 'Ăn vặt', imageUrl: 'https://images.unsplash.com/photo-1516054575922-f0b8eeadec1a?w=400&q=80' },
  { id: 64, sku: 'SN002', name: 'Khô gà lá chanh', price: 35000, category: 'Ăn vặt', imageUrl: 'https://images.unsplash.com/photo-1599423300746-b62533397364?w=400&q=80' },
  { id: 65, sku: 'SN003', name: 'Khoai tây chiên', price: 30000, category: 'Ăn vặt', imageUrl: 'https://images.unsplash.com/photo-1630384060421-a4323ceca0ad?w=400&q=80' },
])

// --- Mock Data: Customers ---
const customers = ref<Customer[]>([
  { id: 101, name: 'Nguyễn Văn A', phone: '0901234567', level: 'VIP', points: 1500 },
  { id: 102, name: 'Trần Thị B', phone: '0912345678', level: 'Member', points: 300 },
  { id: 103, name: 'Lê Văn C', phone: '0988777666', level: 'Diamond', points: 5000 },
  { id: 104, name: 'Phạm Thị D', phone: '0977888999', level: 'Member', points: 50 },
  { id: 105, name: 'Hoàng Văn E', phone: '0909090909', level: 'VIP', points: 2100 },
])

// --- Customer Search State ---
const customerSearchQuery = ref('')
const selectedCustomer = ref<Customer | null>(null)
const isCustomerDropdownOpen = ref(false)

// --- Add Customer Modal State ---
const showAddCustomerModal = ref(false)
const newCustomerForm = ref({
  name: '',
  phone: '',
  address: ''
})

// --- Note Modal State ---
const showNoteModal = ref(false)
const orderNote = ref('')

// --- Custom Product Modal State ---
const showCustomProductModal = ref(false)
const customProductForm = ref({
  name: '',
  price: 0
})

// --- Payment Modal State ---
const showPaymentModal = ref(false)
const paymentMethod = ref<'cash' | 'transfer' | 'card'>('cash')
const customerPaid = ref(0)
const autoPrint = ref(false)

// --- Discount Modal State ---
const showDiscountModal = ref(false)
const discountType = ref<'percent' | 'amount'>('percent')
const discountValue = ref(0)

// --- Product Note Modal State ---
const showProductNoteModal = ref(false)
const editingProductNote = ref<CartItem | null>(null)
const tempProductNote = ref('')

// --- Employee State ---
const employees = ref(['Phạm Văn Toàn', 'Nguyễn Thị Hương', 'Lê Hoài Nam'])
const selectedEmployee = ref(employees.value[0])
const showEmployeeMenu = ref(false)

// --- Order History State ---
const orderHistory = ref<any[]>([])
const showOrderHistoryModal = ref(false)

// --- Return/Exchange State (Main Interface) ---
// const showReturnModal = ref(false)
// const returnMode = ref<'return' | 'exchange'>('return')
// const selectedReturnOrder = ref<any>(null)
// const returnItems = ref<any[]>([])
// const returnReason = ref('')
// const searchOrderQuery = ref('')
const showExchangeModal = ref(false)


// --- Branch State ---
const branches = ref(['Chi nhánh chính', 'Chi nhánh 2 - HN', 'Chi nhánh 3 - HCM'])
const selectedBranch = ref(branches.value[0])
const showBranchMenu = ref(false)

// --- Tab Navigation State ---
const tabsContainer = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

// --- System State ---
const isOnline = ref(true)
const categories = computed(() => ['Tất cả', ...new Set(products.value.map(p => p.category))])
const selectedCategory = ref('Tất cả')

// Filtered Products
const filteredProducts = computed(() => {
  let result = products.value

  if (selectedCategory.value !== 'Tất cả') {
    result = result.filter(p => p.category === selectedCategory.value)
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q)
    )
  }
  return result
})

// Filtered Customers
const filteredCustomers = computed(() => {
  if (!customerSearchQuery.value.trim()) return []
  const q = customerSearchQuery.value.toLowerCase()
  return customers.value.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q))
})

// Default Mock Cart
const cart = ref<CartItem[]>([
  { ...products.value[0]!, quantity: 1, note: '' },
  { ...products.value[8]!, quantity: 2, note: 'Ít đường' } // Trà đào
])

// --- Computed Totals ---
// Total Quantity (absolute count of items)
const totalQuantity = computed(() => cart.value.reduce((sum, item) => sum + Math.abs(item.quantity), 0))

// Subtotal: Sum of (Price * Quantity). Returns will be negative.
const subTotal = computed(() => cart.value.reduce((sum, item) => {
  // If return item, quantity is negative, so price * qty is negative. Correct.
  return sum + (item.price * item.quantity)
}, 0))

// Discount calculation
const discount = computed(() => {
  // Discount applies only to positive subtotal parts usually, but for simplicity:
  const positiveSubTotal = cart.value.filter(i => !i.isReturn).reduce((sum, i) => sum + (i.price * i.quantity), 0)

  if (discountType.value === 'percent') {
    return Math.round(positiveSubTotal * discountValue.value / 100)
  } else {
    return discountValue.value
  }
})

// Total Amount: Can be negative (refund)
const totalAmount = computed(() => subTotal.value - discount.value)

// Change calculation for payment
// If totalAmount is negative, customerPaid is usually 0, and changeAmount is the refund amount (positive)
const changeAmount = computed(() => {
  if (totalAmount.value < 0) return Math.abs(totalAmount.value) // Refund needed
  return Math.max(0, customerPaid.value - totalAmount.value)
})

// [Deleted] filteredOrders moved to OrderSelector component

// --- Actions ---
function setActiveTab(id: number) {
  activeTabId.value = id
}

function addTab() {
  const newId = tabIdCounter++
  tabs.value.push({ id: newId, label: `Đơn #${newId}` })
  activeTabId.value = newId
}

function closeTab(id: number) {
  if (tabs.value.length === 1) return
  const index = tabs.value.findIndex(t => t.id === id)
  tabs.value = tabs.value.filter(t => t.id !== id)

  if (activeTabId.value === id) {
    const fallbackTab = tabs.value[Math.max(0, index - 1)]
    if (fallbackTab) {
      activeTabId.value = fallbackTab.id
    } else if (tabs.value.length > 0) {
      activeTabId.value = tabs.value[0]!.id
    }
  }
}

function addToCart(product: Product) {
  // Find item with same ID AND same Note (empty) AND same Price (original)
  // This allows creating separate lines for items with different notes/prices
  const existingItem = cart.value.find(item =>
    item.id === product.id &&
    !item.isReturn &&
    (item.note === '' || item.note === undefined || item.note === null) &&
    item.price === product.price
  )

  if (existingItem) {
    existingItem.quantity++
  } else {
    cart.value.push({ ...product, quantity: 1, note: '' })
  }
}



function removeFromCart(id: number) {
  cart.value = cart.value.filter(item => item.id !== id)
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price).replace('₫', '')
}

// --- Image Handling & Colors ---
const imageErrors = ref<Record<number, boolean>>({})

function handleImageError(id: number) {
  imageErrors.value[id] = true
}

const productColors = [
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-amber-100 text-amber-700',
  'bg-red-100 text-red-700',
  'bg-purple-100 text-purple-700',
  'bg-pink-100 text-pink-700',
  'bg-indigo-100 text-indigo-700',
  'bg-teal-100 text-teal-700',
  'bg-cyan-100 text-cyan-700',
  'bg-lime-100 text-lime-700'
]

function getProductColor(id: number) {
  return productColors[id % productColors.length]
}

// Customer Selection Logic
function onCustomerSearchInput() {
  isCustomerDropdownOpen.value = true
}

function selectCustomer(cust: Customer) {
  selectedCustomer.value = cust
  customerSearchQuery.value = ''
  isCustomerDropdownOpen.value = false
}

function removeCustomer() {
  selectedCustomer.value = null
}

// --- Add Customer Logic ---
function openAddCustomerModal() {
  newCustomerForm.value = {
    name: '', // Reset form
    phone: customerSearchQuery.value, // Pre-fill if they typed a number
    address: ''
  }
  isCustomerDropdownOpen.value = false
  showAddCustomerModal.value = true
}

function saveNewCustomer() {
  if (!newCustomerForm.value.name || !newCustomerForm.value.phone) {
    alert('Vui lòng nhập tên và số điện thoại')
    return
  }

  const newId = Math.max(...customers.value.map(c => c.id)) + 1
  const newCust: Customer = {
    id: newId,
    name: newCustomerForm.value.name,
    phone: newCustomerForm.value.phone,
    address: newCustomerForm.value.address,
    level: 'Member',
    points: 0
  }

  customers.value.push(newCust)
  selectedCustomer.value = newCust // Auto select
  showAddCustomerModal.value = false
}

// --- Footer Actions ---
function handlePrintLater() {
  if (cart.value.length === 0) {
    alert('Giỏ hàng đang trống!')
    return
  }
  // Allow logic to save order to server...
  alert('Đã lưu đơn hàng vào danh sách in sau!')
  cart.value = [] // Clear cart
  selectedCustomer.value = null
  orderNote.value = ''
}

function saveNote() {
  showNoteModal.value = false
}

function addCustomProduct() {
  if (!customProductForm.value.name || customProductForm.value.price <= 0) {
    alert('Vui lòng nhập tên sản phẩm và giá hợp lệ')
    return
  }

  const newId = Math.max(...products.value.map(p => p.id), ...cart.value.map(i => i.id)) + 1

  const customItem: CartItem = {
    id: newId,
    sku: `CUSTOM-${newId}`,
    name: customProductForm.value.name,
    price: customProductForm.value.price,
    imageUrl: '', // No image for custom product
    category: 'Tùy chỉnh',
    quantity: 1,
    note: ''
  }

  cart.value.push(customItem)

  // Reset form
  customProductForm.value = { name: '', price: 0 }
  showCustomProductModal.value = false
}

// --- Discount Functions ---
function openDiscountModal() {
  showDiscountModal.value = true
}

function applyDiscount() {
  showDiscountModal.value = false
}

function clearDiscount() {
  discountValue.value = 0
  discountType.value = 'percent'
  showDiscountModal.value = false
}

// --- Product Note Functions ---
function openProductNoteModal(item: CartItem) {
  editingProductNote.value = item
  tempProductNote.value = item.note || ''
  showProductNoteModal.value = true
}

function saveProductNote() {
  if (editingProductNote.value) {
    editingProductNote.value.note = tempProductNote.value
  }
  showProductNoteModal.value = false
  editingProductNote.value = null
  tempProductNote.value = ''
}

// --- Payment Functions ---
function openPaymentModal() {
  if (cart.value.length === 0) {
    alert('Giỏ hàng đang trống!')
    return
  }

  // Auto-fill customer paid with total amount
  customerPaid.value = totalAmount.value
  showPaymentModal.value = true
}

function completePayment() {
  if (customerPaid.value < totalAmount.value) {
    alert('Số tiền khách đưa chưa đủ!')
    return
  }

  // Create order object
  const order = {
    id: Date.now(),
    orderNumber: `HD${String(orderHistory.value.length + 1).padStart(4, '0')}`,
    date: new Date().toISOString(),
    items: [...cart.value],
    customer: selectedCustomer.value,
    employee: selectedEmployee.value,
    branch: selectedBranch.value,
    subTotal: subTotal.value,
    discount: discount.value,
    total: totalAmount.value,
    paid: customerPaid.value,
    change: changeAmount.value,
    paymentMethod: paymentMethod.value,
    note: orderNote.value,
    status: 'completed'
  }

  // Save to history
  orderHistory.value.unshift(order)

  // Save to localStorage
  try {
    localStorage.setItem('pos_order_history', JSON.stringify(orderHistory.value))
  } catch (e) {
    console.error('Failed to save order history:', e)
  }

  // Print if auto-print is enabled
  if (autoPrint.value) {
    printInvoice(order)
  }

  // Show success message
  alert(`Thanh toán thành công!\nMã đơn: ${order.orderNumber}\nTiền thừa: ${formatPrice(changeAmount.value)} ₫`)

  // Reset cart and close modal
  clearCurrentOrder()
  showPaymentModal.value = false
}

function clearCurrentOrder() {
  cart.value = []
  selectedCustomer.value = null
  orderNote.value = ''
  discountValue.value = 0
  customerPaid.value = 0
}

function printInvoice(order: any) {
  // Simple print implementation
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const invoiceHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Hóa đơn ${order.orderNumber}</title>
      <style>
        body { font-family: 'Courier New', monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
        h2 { text-align: center; margin: 10px 0; }
        .divider { border-top: 1px dashed #000; margin: 10px 0; }
        .row { display: flex; justify-content: space-between; margin: 5px 0; }
        .total { font-weight: bold; font-size: 1.2em; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 5px 0; }
      </style>
    </head>
    <body>
      <h2>ZenPOS</h2>
      <div style="text-align: center; margin-bottom: 10px;">
        <div>${order.branch}</div>
        <div>Mã đơn: ${order.orderNumber}</div>
        <div>${new Date(order.date).toLocaleString('vi-VN')}</div>
      </div>
      <div class="divider"></div>
      <table>
        ${order.items.map((item: CartItem) => `
          <tr>
            <td>${item.name}</td>
            <td style="text-align: right;">${item.quantity} x ${formatPrice(item.price)}</td>
          </tr>
          ${item.note ? `<tr><td colspan="2" style="font-size: 0.9em; color: #666;">  Ghi chú: ${item.note}</td></tr>` : ''}
        `).join('')}
      </table>
      <div class="divider"></div>
      <div class="row"><span>Tạm tính:</span><span>${formatPrice(order.subTotal)} ₫</span></div>
      ${order.discount > 0 ? `<div class="row"><span>Giảm giá:</span><span>-${formatPrice(order.discount)} ₫</span></div>` : ''}
      <div class="row total"><span>Tổng cộng:</span><span>${formatPrice(order.total)} ₫</span></div>
      <div class="row"><span>Tiền khách đưa:</span><span>${formatPrice(order.paid)} ₫</span></div>
      <div class="row"><span>Tiền thừa:</span><span>${formatPrice(order.change)} ₫</span></div>
      <div class="divider"></div>
      ${order.customer ? `<div style="text-align: center;">Khách hàng: ${order.customer.name}</div>` : ''}
      <div style="text-align: center;">Nhân viên: ${order.employee}</div>
      ${order.note ? `<div style="margin-top: 10px;">Ghi chú: ${order.note}</div>` : ''}
      <div style="text-align: center; margin-top: 20px;">Cảm ơn quý khách!</div>
    </body>
    </html>
  `

  printWindow.document.write(invoiceHTML)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 250)
}

// --- Unified Return/Exchange Logic ---
function handleReturnMode() {
  viewMode.value = 'return'
  // Optionally clear cart or ask user
  if (cart.value.length > 0 && !confirm('Giỏ hàng hiện tại sẽ bị xóa để chuyển sang chế độ trả hàng?')) {
    return
  }
  cart.value = []
}

function handleOpenExchange() {
  showExchangeModal.value = true
}

function addReturnItemToCart(item: any, order: any, delta: number) {
  // Check if item already exists in cart
  const existingItem = cart.value.find(i => i.id === item.id && i.isReturn && i.originalOrderId === order.id)

  if (existingItem) {
    // Delta comes from UI Return Stepper:
    // +1 means "Return ONE MORE" => In cart (negative qty), this means subtract 1 (e.g. -1 -> -2)
    // -1 means "Return ONE LESS" => In cart, this means add 1 (e.g. -2 -> -1)

    const newQty = existingItem.quantity - delta

    if (newQty === 0) {
      // Remove item if quantity goes back to 0
      cart.value = cart.value.filter(i => i !== existingItem)
    } else {
      existingItem.quantity = newQty
    }
  } else {
    // Item not in cart yet, can only occur if delta > 0 (returning first item)
    if (delta > 0) {
      // Try to find original product info to fill missing fields (img, sku...)
      const originalProduct = products.value.find(p => p.id === item.id)

      cart.value.push({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: -1,
        sku: originalProduct?.sku || `RET-${item.id}`,
        imageUrl: originalProduct?.imageUrl || '',
        category: originalProduct?.category || 'Hàng trả',
        note: `Trả từ đơn #${order.orderNumber}`,
        isReturn: true,
        maxReturnQty: item.quantity,
        originalOrderId: order.id
      })
    }
  }
}

// Override updateQuantity to handle negative values properly
function updateQuantity(item: CartItem, delta: number) {
  if (item.isReturn) {
    // For return items: 
    // delta = 1 means INCREASE quantity (towards 0, e.g. -2 -> -1) -> Returing FEWER items
    // delta = -1 means DECREASE quantity (towards infinity, e.g. -1 -> -2) -> Returning MORE items

    const currentReturnQty = Math.abs(item.quantity)
    const maxQty = item.maxReturnQty || 0

    if (delta === -1) {
      // User wants to return MORE (quantity becomes more negative)
      if (currentReturnQty < maxQty) {
        item.quantity--
      } else {
        alert('Không thể trả quá số lượng đã mua!')
      }
    } else if (delta === 1) {
      // User wants to return LESS
      if (currentReturnQty > 1) {
        item.quantity++
      } else {
        // Remove item if return qty goes to 0 (user clicks + on -1)
        // Actually usually UI handles removal separately, but here let's allow it
        // or keeps it at -1 and requires explicit delete
        item.quantity = -1 // Keep at least 1 returned
      }
    }
  } else {
    // Normal items (Positive quantity)
    const newQty = item.quantity + delta
    if (newQty > 0) {
      item.quantity = newQty
    }
  }
}

// --- Handler Functions for Modal Components ---
function handlePaymentComplete(data: { method: string; paid: number; change: number }) {
  const order = {
    id: Date.now(),
    orderNumber: `HD${String(orderHistory.value.length + 1).padStart(4, '0')}`,
    date: new Date().toISOString(),
    items: [...cart.value],
    customer: selectedCustomer.value,
    employee: selectedEmployee.value,
    branch: selectedBranch.value,
    subTotal: subTotal.value,
    discount: discount.value,
    total: totalAmount.value,
    paid: data.paid,
    change: data.change,
    paymentMethod: data.method,
    note: orderNote.value,
    status: 'completed'
  }

  orderHistory.value.unshift(order)

  try {
    localStorage.setItem('pos_order_history', JSON.stringify(orderHistory.value))
  } catch (e) {
    console.error('Failed to save order history:', e)
  }

  if (autoPrint.value) {
    printInvoice(order)
  }

  alert(`Thanh toán thành công!\nMã đơn: ${order.orderNumber}\nTiền thừa: ${formatPrice(data.change)} ₫`)

  clearCurrentOrder()
  showPaymentModal.value = false
}

function handleSaveProductNote(data: { note: string; price: number }) {
  if (editingProductNote.value) {
    editingProductNote.value.note = data.note
    if (data.price >= 0) {
      editingProductNote.value.price = data.price
    }
  }
  showProductNoteModal.value = false
  editingProductNote.value = null
}

// Load order history from localStorage on mount
onMounted(() => {
  window.addEventListener('keydown', handleKeydown)

  // Setup scroll listener for tabs
  if (tabsContainer.value) {
    tabsContainer.value.addEventListener('scroll', updateScrollButtons)
    updateScrollButtons()
  }

  // Update scroll buttons after a short delay to ensure proper rendering
  setTimeout(updateScrollButtons, 100)

  // Load order history
  try {
    const saved = localStorage.getItem('pos_order_history')
    if (saved) {
      orderHistory.value = JSON.parse(saved)
    }
  } catch (e) {
    console.error('Failed to load order history:', e)
  }
})

// --- Tab Navigation Functions ---
function updateScrollButtons() {
  if (!tabsContainer.value) return

  const container = tabsContainer.value
  const scrollLeft = container.scrollLeft
  const maxScroll = container.scrollWidth - container.clientWidth

  canScrollLeft.value = scrollLeft > 5
  canScrollRight.value = scrollLeft < maxScroll - 5

  console.log('Scroll state:', { scrollLeft, maxScroll, canLeft: canScrollLeft.value, canRight: canScrollRight.value })
}

function scrollTabs(direction: 'left' | 'right') {
  console.log('scrollTabs called:', direction)
  if (!tabsContainer.value) return

  const container = tabsContainer.value
  // Scroll by one tab size (approx 120px + gap)
  const tabSize = 120
  const currentScroll = container.scrollLeft

  // Calculate target scroll to snap to next tab
  const targetScroll = direction === 'left'
    ? Math.max(0, currentScroll - tabSize)
    : Math.min(container.scrollWidth, currentScroll + tabSize)

  container.scrollTo({
    left: targetScroll,
    behavior: 'smooth'
  })

  // Update buttons after scroll animation
  setTimeout(updateScrollButtons, 350)
}

// Watch for tab changes to update scroll buttons state
watch(() => tabs.value.length, () => {
  nextTick(() => {
    updateScrollButtons()
  })
})



// --- Keyboard Shortcuts ---
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'F1') {
    e.preventDefault()
    handlePrintLater()
  }
  if (e.key === 'F2') {
    e.preventDefault()
    showCustomProductModal.value = true
  }
  if (e.key === 'F3') {
    e.preventDefault()
    const searchInput = document.querySelector('input[placeholder*="Tìm kiếm sản phẩm"]') as HTMLInputElement
    searchInput?.focus()
  }
  if (e.key === 'F4') {
    e.preventDefault()
    const customerInput = document.querySelector('input[placeholder*="Tìm khách hàng"]') as HTMLInputElement
    customerInput?.focus()
  }
  if (e.key === 'F6') {
    e.preventDefault()
    openDiscountModal()
  }
  if (e.key === 'F9') {
    e.preventDefault()
    openPaymentModal()
  }
  if (e.key === 'F10') {
    e.preventDefault()
    autoPrint.value = !autoPrint.value
  }
}


onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)

  const header = document.querySelector('header')
  if (header) {
    const container = header.querySelector('[ref="tabsContainer"]') as HTMLElement
    if (container) {
      container.removeEventListener('scroll', updateScrollButtons)
    }
  }
})
</script>

<template>
  <div class="h-screen w-full bg-slate-50 flex flex-col overflow-hidden font-sans text-slate-800">
    <!-- 1. Top Header -->
    <PosHeader v-model:search-query="searchQuery" v-model:is-online="isOnline" v-model:selected-branch="selectedBranch"
      :tabs="tabs" :active-tab-id="activeTabId" :can-scroll-left="canScrollLeft" :can-scroll-right="canScrollRight"
      :branches="branches" @set-active-tab="setActiveTab" @add-tab="addTab" @close-tab="closeTab"
      @scroll-tabs="scrollTabs" />

    <!-- 2. Main Layout -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Left Sidebar (Navigation) -->
      <nav class="w-16 bg-white border-r border-slate-200 flex flex-col items-center py-4 gap-4 z-10">
        <button @click="navigateTo('/')"
          class="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          title="Trang chủ">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </button>

        <button @click="navigateTo('/pos')"
          class="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm ring-1 ring-blue-200"
          title="Bán hàng">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </button>

        <button @click="navigateTo('/orders')"
          class="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          title="Hóa đơn">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </button>

        <div class="mt-auto flex flex-col gap-4">
          <button @click="navigateTo('/settings')"
            class="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Cài đặt">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </nav>

      <!-- Center Content (Product List / Grid) -->
      <main class="flex-1 flex flex-col bg-slate-50 relative min-w-0">

        <!-- View Mode: Sales (Product Grid) -->
        <template v-if="viewMode === 'sales'">
          <!-- Filter Bar -->
          <div
            class="h-12 border-b border-slate-200 bg-white flex items-center gap-4 px-4 shrink-0 z-10 overflow-x-auto no-scrollbar">
            <button v-for="cat in categories" :key="cat" @click="selectedCategory = cat"
              class="px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap border border-transparent"
              :class="selectedCategory === cat ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'">
              {{ cat }}
            </button>
          </div>

          <!-- Product Grid Area -->
          <div class="flex-1 overflow-y-auto p-4">
            <div v-if="filteredProducts.length > 0"
              class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              <div v-for="product in filteredProducts" :key="product.id" @click="addToCart(product)"
                class="group bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden cursor-pointer hover:shadow-md hover:border-blue-400 transition-all flex flex-col">
                <!-- Image -->
                <div class="aspect-square relative overflow-hidden transition-colors"
                  :class="imageErrors[product.id] ? getProductColor(product.id) : 'bg-slate-100'">
                  <!-- Real Image -->
                  <img v-if="!imageErrors[product.id] && product.imageUrl" :src="product.imageUrl" :alt="product.name"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy" @error="handleImageError(product.id)">

                  <!-- Fallback Content (Color + Initial/Name) -->
                  <div v-else class="w-full h-full flex items-center justify-center p-4 text-center">
                    <span class="font-bold text-lg leading-tight opacity-90 select-none">
                      {{ product.name }}
                    </span>
                  </div>

                  <div v-if="!imageErrors[product.id]"
                    class="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors"></div>

                  <!-- SKU Badge -->
                  <div
                    class="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                    {{ product.sku }}
                  </div>
                </div>
                <!-- Info -->
                <div class="p-3 flex flex-col flex-1">
                  <h3 class="font-medium text-slate-700 text-sm line-clamp-2 mb-1 group-hover:text-blue-700">{{
                    product.name }}</h3>
                  <div class="mt-auto flex items-center justify-between">
                    <span class="font-bold text-slate-900">{{ formatPrice(product.price) }}</span>
                    <button
                      class="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty result -->
            <div v-else class="h-full flex flex-col items-center justify-center text-slate-400">
              <div class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <svg class="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p>Không tìm thấy sản phẩm nào</p>
            </div>
          </div>
        </template>

        <!-- View Mode: Return (Order Selector) -->
        <OrderSelector v-else-if="viewMode === 'return'" :orders="orderHistory" :cart="cart"
          @select-return-item="addReturnItemToCart" @open-exchange-modal="handleOpenExchange"
          @set-customer="selectCustomer" />

        <ProductSelectorModal :show="showExchangeModal" :products="products" :categories="categories"
          @close="showExchangeModal = false" @add-to-cart="addToCart" />

      </main>

      <!-- Right Sidebar (Checkout Cart) -->
      <aside class="w-96 bg-white border-l border-slate-200 flex flex-col z-10 shadow-xl shrink-0">
        <!-- Customer Search -->
        <div class="p-4 border-b border-slate-100 flex flex-col gap-3">
          <!-- Selected Customer View -->
          <div v-if="selectedCustomer"
            class="bg-blue-50 rounded-lg p-3 border border-blue-100 flex items-center justify-between group relative">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-full bg-white flex items-center justify-center text-blue-600 font-bold border border-blue-200">
                {{ selectedCustomer.name.charAt(0) }}
              </div>
              <div>
                <div class="font-bold text-slate-800 text-sm">{{ selectedCustomer.name }}</div>
                <div class="text-xs text-slate-500">{{ selectedCustomer.phone }} • <span
                    class="text-amber-600 font-medium">{{
                      selectedCustomer.level }}</span></div>
              </div>
            </div>
            <button @click="removeCustomer"
              class="text-slate-400 hover:text-red-500 p-1 rounded-full hover:bg-white transition-colors">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Search Input -->
          <div v-else class="relative">
            <div class="flex gap-2">
              <div class="relative flex-1">
                <input v-model="customerSearchQuery" @input="onCustomerSearchInput" type="text"
                  placeholder="Tìm khách hàng (F4)"
                  class="w-full h-10 pl-10 pr-4 rounded-lg bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-0 text-sm transition-all" />
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>

              <button @click="openAddCustomerModal"
                class="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-600 flex items-center justify-center transition-colors"
                title="Thêm khách hàng mới">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            <!-- Dropdown Results -->
            <div v-if="customerSearchQuery && isCustomerDropdownOpen"
              class="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-slate-100 z-50 max-h-64 overflow-y-auto">
              <div v-if="filteredCustomers.length > 0">
                <div v-for="cust in filteredCustomers" :key="cust.id" @click="selectCustomer(cust)"
                  class="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 flex items-center justify-between">
                  <div>
                    <div class="font-medium text-slate-800 text-sm">{{ cust.name }}</div>
                    <div class="text-xs text-slate-500">{{ cust.phone }}</div>
                  </div>
                  <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{{ cust.level }}</span>
                </div>
              </div>

              <div v-else class="p-4 flex flex-col items-center text-center">
                <p class="text-sm text-slate-500 mb-3">Không tìm thấy khách hàng nào</p>
                <button @click="openAddCustomerModal"
                  class="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Thêm mới khách hàng
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Cart Items List -->
        <div class="flex-1 overflow-y-auto bg-slate-50/30">
          <div v-if="cart.length > 0">
            <div v-for="item in cart" :key="item.id"
              class="p-3 bg-white border-b border-slate-100 flex gap-3 group relative hover:bg-slate-50">
              <!-- Item Img -->
              <div class="w-12 h-12 rounded bg-slate-100 overflow-hidden shrink-0">
                <img :src="item.imageUrl" class="w-full h-full object-cover">
              </div>

              <!-- Item Details -->
              <div class="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div class="flex justify-between items-start gap-2">
                  <div class="flex-1">
                    <h4 class="text-sm font-medium text-slate-700 truncate cursor-pointer hover:text-blue-600">{{
                      item.name }}</h4>
                    <div v-if="item.note" class="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
                      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span class="truncate">{{ item.note }}</span>
                    </div>
                  </div>
                  <div @click="openProductNoteModal(item)" class="text-right cursor-pointer group/price"
                    title="Click để sửa giá">
                    <span
                      class="text-sm font-bold text-slate-800 group-hover/price:text-blue-600 group-hover/price:underline decoration-dashed decoration-slate-300 underline-offset-4 transition-all">
                      {{ formatPrice(item.price * item.quantity) }}
                    </span>
                  </div>
                </div>

                <div class="flex items-center justify-between mt-1">
                  <div class="flex items-center gap-1">
                    <div class="flex items-center gap-1 bg-slate-100 rounded p-0.5">
                      <button @click="updateQuantity(item, -1)"
                        class="w-6 h-6 flex items-center justify-center rounded bg-white text-slate-600 shadow-sm hover:text-blue-600 disabled:opacity-50"
                        :disabled="item.quantity <= 1">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                        </svg>
                      </button>
                      <input type="text" :value="item.quantity" readonly
                        class="w-8 text-center bg-transparent text-xs font-semibold focus:outline-none">
                      <button @click="updateQuantity(item, 1)"
                        class="w-6 h-6 flex items-center justify-center rounded bg-white text-slate-600 shadow-sm hover:text-blue-600">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>

                    <button @click="openProductNoteModal(item)"
                      class="p-1.5 text-slate-400 hover:text-amber-500 rounded hover:bg-amber-50 transition-colors"
                      :class="{ 'text-amber-500 bg-amber-50': item.note }" title="Ghi chú">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>

                  <button @click="removeFromCart(item.id)"
                    class="p-1.5 text-slate-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors"
                    title="Xóa">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty Cart State -->
          <div v-else class="h-full flex flex-col items-center justify-center text-slate-400">
            <svg class="w-16 h-16 opacity-20 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span class="text-sm">Giỏ hàng trống</span>
          </div>
        </div>

        <!-- Totals & Payment -->
        <PosFooter v-model:auto-print="autoPrint" :total-quantity="totalQuantity" :sub-total="subTotal"
          :discount="discount" :total-amount="totalAmount" @open-discount="openDiscountModal"
          @open-payment="openPaymentModal" />
      </aside>
    </div>

    <!-- 3. Bottom Utility Bar -->
    <div class="h-14 bg-white border-t border-slate-200 px-4 flex items-center gap-4 text-sm shrink-0">
      <div class="flex items-center gap-2">
        <button @click="handlePrintLater"
          class="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center gap-2 font-medium">
          <svg class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          In sau (F1)
        </button>
        <button @click="showNoteModal = true"
          class="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center gap-2 font-medium"
          :class="{ 'bg-yellow-50 border-yellow-200 text-yellow-700': orderNote }">
          <svg class="w-4 h-4 text-slate-400" :class="{ 'text-yellow-500': orderNote }" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          {{ orderNote ? 'Đã có ghi chú' : 'Ghi chú' }}
        </button>
      </div>

      <div class="flex-1"></div>

      <div class="flex items-center gap-4">
        <div class="relative">
          <button @click="showEmployeeMenu = !showEmployeeMenu"
            class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100 hover:border-slate-200 transition-colors cursor-pointer">
            <span class="text-slate-500">Nhân viên:</span>
            <span class="font-semibold text-slate-800">{{ selectedEmployee }}</span>
            <svg class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <!-- Employee Dropdown -->
          <div v-if="showEmployeeMenu"
            class="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-20 animate-fade-in-up">
            <div class="py-1">
              <button v-for="emp in employees" :key="emp" @click="selectedEmployee = emp; showEmployeeMenu = false"
                class="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between"
                :class="selectedEmployee === emp ? 'text-blue-600 font-medium bg-blue-50' : 'text-slate-700'">
                {{ emp }}
                <svg v-if="selectedEmployee === emp" class="w-4 h-4" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Backdrop for closing dropdown -->
          <div v-if="showEmployeeMenu" @click="showEmployeeMenu = false" class="fixed inset-0 z-10"></div>
        </div>

        <button @click="showCustomProductModal = true"
          class="px-4 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium transition-colors flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Sản phẩm tùy chỉnh (F2)
        </button>

        <button @click="handleReturnMode"
          class="px-4 py-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 font-medium transition-colors flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
          Trả hàng / Đổi hàng
        </button>
      </div>
    </div>

    <!-- Modal Components -->
    <AddCustomerModal v-model:show="showAddCustomerModal" v-model:form="newCustomerForm" @save="saveNewCustomer" />

    <OrderNoteModal v-model:show="showNoteModal" v-model:note="orderNote" @save="saveNote" />

    <CustomProductModal v-model:show="showCustomProductModal" v-model:form="customProductForm"
      @add="addCustomProduct" />

    <PaymentModal v-model:show="showPaymentModal" v-model:auto-print="autoPrint" :sub-total="subTotal"
      :discount="discount" :total-amount="totalAmount" @complete="handlePaymentComplete" />

    <DiscountModal v-model:show="showDiscountModal" v-model:discount-type="discountType"
      v-model:discount-value="discountValue" :sub-total="subTotal" :discount="discount" :total-amount="totalAmount"
      @apply="applyDiscount" @clear="clearDiscount" />

    <ProductNoteModal v-model:show="showProductNoteModal" :item="editingProductNote" @save="handleSaveProductNote" />
  </div>
</template>

<style scoped>
/* Custom scrollbar for table/list areas */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.2s ease-out forwards;
}
</style>
