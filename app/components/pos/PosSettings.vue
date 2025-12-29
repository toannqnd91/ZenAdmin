<template>
    <div class="h-full flex bg-slate-50">
        <!-- Sidebar -->
        <PosSidebar class="w-80 shadow-[4px_0_24px_-4px_rgba(0,0,0,0.05)] z-10">
            <template #header>
                <div class="p-6 bg-slate-900 text-white">
                    <div class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Hệ thống</div>
                    <div class="text-2xl font-bold tracking-tight">Cấu hình POS</div>
                    <div class="text-sm text-slate-400 mt-1">Phiên bản 2.5.0</div>
                </div>
            </template>

            <div
                class="px-4 py-2 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 sticky top-0 z-10">
                Danh mục cài đặt
            </div>

            <PosListItem v-for="category in categories" :key="category.id" :active="selectedCategory === category.id"
                @click="selectedCategory = category.id">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                        :class="selectedCategory === category.id ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-white text-slate-400 border border-slate-100'">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="category.icon" />
                        </svg>
                    </div>
                    <div>
                        <div class="font-bold text-slate-800 text-[15px] group-hover:text-blue-700 transition-colors">{{
                            category.label }}</div>
                        <div class="text-xs text-slate-500 mt-0.5">{{ category.description }}</div>
                    </div>
                </div>
            </PosListItem>
        </PosSidebar>

        <!-- Right Column -->
        <div class="flex-1 flex flex-col bg-slate-50 min-w-0">
            <!-- Header -->
            <div
                class="bg-white px-8 py-6 border-b border-slate-200 shrink-0 z-20 relative flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold text-slate-800 tracking-tight mb-1">
                        {{ activeCategory.label }}
                    </h1>
                    <p class="text-slate-500 text-sm font-medium">{{ activeCategory.description }}</p>
                </div>

                <button @click="saveSettings"
                    class="h-10 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-bold shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 text-sm active:scale-[0.98]">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Lưu thay đổi
                </button>
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-y-auto bg-white">
                <div class="max-w-4xl mx-auto py-8 px-8 space-y-12">

                    <!-- General Settings -->
                    <div v-if="selectedCategory === 'general'" class="animate-fade-in-up">
                        <div class="mb-8 border-b border-slate-100 pb-6">
                            <h3 class="text-lg font-bold text-slate-900 mb-1">Thông tin cửa hàng</h3>
                            <p class="text-sm text-slate-500">Quản lý thông tin cửa hàng hiển thị trên hóa đơn và phiếu
                                in</p>
                        </div>

                        <div class="space-y-6">
                            <!-- Store Name -->
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                                <div class="md:col-span-1 pt-2">
                                    <label class="block text-sm font-semibold text-slate-900">Tên cửa hàng <span
                                            class="text-rose-500">*</span></label>
                                    <p class="text-xs text-slate-500 mt-1">Tên thương hiệu chính thức</p>
                                </div>
                                <div class="md:col-span-2">
                                    <input type="text" v-model="settings.storeName"
                                        class="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium text-slate-800 text-sm placeholder-slate-400"
                                        placeholder="Nhập tên cửa hàng">
                                </div>
                            </div>

                            <!-- Phone -->
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                                <div class="md:col-span-1 pt-2">
                                    <label class="block text-sm font-semibold text-slate-900">Số điện thoại</label>
                                    <p class="text-xs text-slate-500 mt-1">Hotline liên hệ</p>
                                </div>
                                <div class="md:col-span-2">
                                    <input type="text" v-model="settings.storePhone"
                                        class="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium text-slate-800 text-sm placeholder-slate-400"
                                        placeholder="VD: 0901234567">
                                </div>
                            </div>

                            <!-- Email -->
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                                <div class="md:col-span-1 pt-2">
                                    <label class="block text-sm font-semibold text-slate-900">Email</label>
                                    <p class="text-xs text-slate-500 mt-1">Email nhận thông báo</p>
                                </div>
                                <div class="md:col-span-2">
                                    <input type="email" v-model="settings.storeEmail"
                                        class="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium text-slate-800 text-sm placeholder-slate-400"
                                        placeholder="VD: contact@brand.com">
                                </div>
                            </div>

                            <!-- Address -->
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                                <div class="md:col-span-1 pt-2">
                                    <label class="block text-sm font-semibold text-slate-900">Địa chỉ</label>
                                    <p class="text-xs text-slate-500 mt-1">Địa chỉ kinh doanh</p>
                                </div>
                                <div class="md:col-span-2">
                                    <textarea v-model="settings.storeAddress" rows="3"
                                        class="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium text-slate-800 text-sm resize-none placeholder-slate-400"
                                        placeholder="Nhập địa chỉ chi tiết"></textarea>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Printer Settings -->
                    <div v-if="selectedCategory === 'print'" class="animate-fade-in-up">
                        <div class="mb-8 border-b border-slate-100 pb-6">
                            <h3 class="text-lg font-bold text-slate-900 mb-1">Cấu hình in ấn</h3>
                            <p class="text-sm text-slate-500">Tùy chỉnh máy in và mẫu hóa đơn</p>
                        </div>

                        <div class="space-y-6">
                            <!-- Auto Print -->
                            <div class="flex items-center justify-between py-2">
                                <div class="md:w-2/3 pr-8">
                                    <div class="font-bold text-slate-900 mb-1">In hóa đơn tự động</div>
                                    <div class="text-sm text-slate-500 leading-relaxed">Tự động in hóa đơn ngay sau khi
                                        hoàn tất
                                        thanh toán thành công</div>
                                </div>
                                <div class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" v-model="settings.autoPrint" class="sr-only peer">
                                    <div
                                        class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600">
                                    </div>
                                </div>
                            </div>

                            <!-- Print Duplicate -->
                            <div class="flex items-center justify-between py-2">
                                <div class="md:w-2/3 pr-8">
                                    <div class="font-bold text-slate-900 mb-1">In 2 liên (Merchant Copy)</div>
                                    <div class="text-sm text-slate-500 leading-relaxed">In thêm một bản sao để cửa hàng
                                        lưu trữ
                                        đối chiếu</div>
                                </div>
                                <div class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" v-model="settings.printDuplicate" class="sr-only peer">
                                    <div
                                        class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600">
                                    </div>
                                </div>
                            </div>

                            <!-- Default Printer -->
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                                <div class="md:col-span-1 pt-2">
                                    <label class="block text-sm font-semibold text-slate-900">Máy in mặc định</label>
                                    <p class="text-xs text-slate-500 mt-1">Thiết bị in chính</p>
                                </div>
                                <div class="md:col-span-2">
                                    <select v-model="settings.defaultPrinter"
                                        class="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none font-medium text-slate-800 text-sm shadow-sm cursor-pointer">
                                        <option value="none">Chưa chọn máy in</option>
                                        <option value="xp80">Xprinter XP-N160II (LAN)</option>
                                        <option value="epson">Epson TM-T82III (USB)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Sales Settings -->
                    <div v-if="selectedCategory === 'sales'" class="animate-fade-in-up">
                        <div class="mb-8 border-b border-slate-100 pb-6">
                            <h3 class="text-lg font-bold text-slate-900 mb-1">Quy tắc bán hàng</h3>
                            <p class="text-sm text-slate-500">Thiết lập quy trình và ràng buộc bán hàng</p>
                        </div>

                        <div class="space-y-6">
                            <!-- Allow Debt -->
                            <div class="flex items-center justify-between py-2">
                                <div class="md:w-2/3 pr-8">
                                    <div class="font-bold text-slate-900 mb-1">Cho phép bán nợ</div>
                                    <div class="text-sm text-slate-500 leading-relaxed">Cho phép thanh toán ghi nợ vào
                                        tài khoản
                                        khách hàng nếu chưa trả đủ</div>
                                </div>
                                <div class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" v-model="settings.allowDebt" class="sr-only peer">
                                    <div
                                        class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600">
                                    </div>
                                </div>
                            </div>

                            <!-- Require Customer -->
                            <div class="flex items-center justify-between py-2">
                                <div class="md:w-2/3 pr-8">
                                    <div class="font-bold text-slate-900 mb-1">Bắt buộc chọn khách hàng</div>
                                    <div class="text-sm text-slate-500 leading-relaxed">Yêu cầu phải chọn khách hàng
                                        trước khi
                                        thanh toán (Không cho phép khách lẻ)</div>
                                </div>
                                <div class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" v-model="settings.requireCustomer" class="sr-only peer">
                                    <div
                                        class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Display Settings -->
                    <div v-if="selectedCategory === 'display'" class="animate-fade-in-up">
                        <div class="mb-8 border-b border-slate-100 pb-6">
                            <h3 class="text-lg font-bold text-slate-900 mb-1">Giao diện bán hàng</h3>
                            <p class="text-sm text-slate-500">Tùy chỉnh hiển thị danh sách sản phẩm và bố cục</p>
                        </div>

                        <div class="space-y-6">
                            <!-- Grid Size -->
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                                <div class="md:col-span-1 pt-2">
                                    <label class="block text-sm font-semibold text-slate-900">Kích thước lưới sản
                                        phẩm</label>
                                    <p class="text-xs text-slate-500 mt-1">Số lượng sản phẩm trên một trang</p>
                                </div>
                                <div class="md:col-span-2">
                                    <div class="grid grid-cols-3 gap-4">
                                        <button @click="settings.productsPerPage = 12"
                                            class="p-4 rounded-lg border bg-slate-50 transition-all text-center hover:bg-white hover:shadow-sm"
                                            :class="settings.productsPerPage === 12 ? 'bg-white border-blue-500 text-blue-700 ring-1 ring-blue-500 shadow-sm' : 'border-slate-200 text-slate-600'">
                                            <div class="text-xl font-bold mb-1">12</div>
                                            <div class="text-[10px] uppercase font-bold opacity-60">Lớn</div>
                                        </button>
                                        <button @click="settings.productsPerPage = 24"
                                            class="p-4 rounded-lg border bg-slate-50 transition-all text-center hover:bg-white hover:shadow-sm"
                                            :class="settings.productsPerPage === 24 ? 'bg-white border-blue-500 text-blue-700 ring-1 ring-blue-500 shadow-sm' : 'border-slate-200 text-slate-600'">
                                            <div class="text-xl font-bold mb-1">24</div>
                                            <div class="text-[10px] uppercase font-bold opacity-60">Vừa</div>
                                        </button>
                                        <button @click="settings.productsPerPage = 48"
                                            class="p-4 rounded-lg border bg-slate-50 transition-all text-center hover:bg-white hover:shadow-sm"
                                            :class="settings.productsPerPage === 48 ? 'bg-white border-blue-500 text-blue-700 ring-1 ring-blue-500 shadow-sm' : 'border-slate-200 text-slate-600'">
                                            <div class="text-xl font-bold mb-1">48</div>
                                            <div class="text-[10px] uppercase font-bold opacity-60">Nhỏ</div>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- Show Images -->
                            <div class="flex items-center justify-between py-2">
                                <div class="md:w-2/3 pr-8">
                                    <div class="font-bold text-slate-900 mb-1">Hiển thị hình ảnh sản phẩm</div>
                                    <div class="text-sm text-slate-500 leading-relaxed">Tắt hình ảnh để tăng tốc độ tải
                                        trang
                                        trên các thiết bị cấu hình thấp hoặc mạng chậm</div>
                                </div>
                                <div class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" v-model="settings.showProductImages" class="sr-only peer">
                                    <div
                                        class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Shortcut Settings -->
                    <div v-if="selectedCategory === 'shortcuts'" class="animate-fade-in-up">
                        <div class="mb-8 border-b border-slate-100 pb-6">
                            <h3 class="text-lg font-bold text-slate-900 mb-1">Phím tắt hệ thống</h3>
                            <p class="text-sm text-slate-500">Danh sách phím tắt giúp thao tác nhanh hơn</p>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
                            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                                <span class="font-medium text-slate-900">Thanh toán</span>
                                <kbd
                                    class="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-bold text-sm font-mono min-w-[3rem] text-center border border-slate-200 shadow-sm">F9</kbd>
                            </div>
                            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                                <span class="font-medium text-slate-900">Tìm kiếm sản phẩm</span>
                                <kbd
                                    class="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-bold text-sm font-mono min-w-[3rem] text-center border border-slate-200 shadow-sm">F3</kbd>
                            </div>
                            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                                <span class="font-medium text-slate-900">Tìm khách hàng</span>
                                <kbd
                                    class="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-bold text-sm font-mono min-w-[3rem] text-center border border-slate-200 shadow-sm">F4</kbd>
                            </div>
                            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                                <span class="font-medium text-slate-900">Sản phẩm tùy chỉnh</span>
                                <kbd
                                    class="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-bold text-sm font-mono min-w-[3rem] text-center border border-slate-200 shadow-sm">F2</kbd>
                            </div>
                            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                                <span class="font-medium text-slate-900">Chiết khấu đơn hàng</span>
                                <kbd
                                    class="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-bold text-sm font-mono min-w-[3rem] text-center border border-slate-200 shadow-sm">F6</kbd>
                            </div>
                            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                                <span class="font-medium text-slate-900">In lại hóa đơn gần nhất</span>
                                <kbd
                                    class="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-bold text-sm font-mono min-w-[3rem] text-center border border-slate-200 shadow-sm">F1</kbd>
                            </div>
                            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                                <span class="font-medium text-slate-900">Bật/Tắt tự động in</span>
                                <kbd
                                    class="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-bold text-sm font-mono min-w-[3rem] text-center border border-slate-200 shadow-sm">F10</kbd>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
    modelValue: {
        storeName: string
        storePhone: string
        storeEmail: string
        storeAddress: string
        autoPrint: boolean
        printDuplicate: boolean
        defaultPrinter: string
        productsPerPage: number
        showProductImages: boolean
        allowDebt: boolean
        requireCustomer: boolean
    }
}>()

const emit = defineEmits(['update:modelValue', 'save'])

const selectedCategory = ref('general')

const categories = [
    { id: 'general', label: 'Thông tin chung', description: 'Cửa hàng & liên hệ', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'print', label: 'Máy in & Hóa đơn', description: 'Mẫu in, khổ giấy', icon: 'M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z' },
    { id: 'sales', label: 'Bán hàng', description: 'Quy tắc & thuế', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { id: 'display', label: 'Giao diện', description: 'Hiển thị & bố cục', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { id: 'shortcuts', label: 'Phím tắt', description: 'Keyboard shortcuts', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4' },
]

const activeCategory = computed(() => categories.find(c => c.id === selectedCategory.value) || categories[0]!)

const settings = computed(() => props.modelValue)

function saveSettings() {
    emit('save')
}
</script>