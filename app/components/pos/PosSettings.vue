<template>
    <div class="h-full flex bg-slate-50">
        <!-- Left Column: Settings Categories -->
        <div class="w-80 flex flex-col bg-white border-r border-slate-200">
            <!-- Header -->
            <div class="border-b border-slate-200 p-4">
                <h2 class="text-lg font-semibold text-slate-800">Cài đặt POS</h2>
            </div>

            <!-- Settings Categories -->
            <div class="flex-1 overflow-y-auto">
                <button v-for="category in categories" :key="category.id" @click="selectedCategory = category.id"
                    class="w-full p-4 border-b border-slate-100 text-left transition-colors"
                    :class="selectedCategory === category.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-slate-50'">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-lg flex items-center justify-center"
                            :class="selectedCategory === category.id ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'">
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    :d="category.icon" />
                            </svg>
                        </div>
                        <div>
                            <div class="font-medium text-slate-800">{{ category.label }}</div>
                            <div class="text-xs text-slate-500">{{ category.description }}</div>
                        </div>
                    </div>
                </button>
            </div>

            <!-- Save Button -->
            <div class="p-4 bg-white border-t border-slate-200">
                <button @click="saveSettings"
                    class="w-full h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
                    Lưu cài đặt
                </button>
            </div>
        </div>

        <!-- Right Column: Settings Content -->
        <div class="flex-1 overflow-y-auto p-6">
            <!-- Print Settings -->
            <div v-if="selectedCategory === 'print'" class="space-y-4">
                <div class="bg-white rounded-lg border border-slate-200 p-5">
                    <h3 class="font-semibold text-slate-800 mb-4">Cài đặt in hóa đơn</h3>
                    <div class="space-y-4">
                        <label class="flex items-center justify-between cursor-pointer">
                            <span class="text-sm text-slate-600">In hóa đơn tự động (F10)</span>
                            <input type="checkbox" v-model="settings.autoPrint"
                                class="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
                        </label>
                        <label class="flex items-center justify-between cursor-pointer">
                            <span class="text-sm text-slate-600">In 2 liên</span>
                            <input type="checkbox" v-model="settings.printDuplicate"
                                class="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
                        </label>
                    </div>
                </div>
            </div>

            <!-- Display Settings -->
            <div v-if="selectedCategory === 'display'" class="space-y-4">
                <div class="bg-white rounded-lg border border-slate-200 p-5">
                    <h3 class="font-semibold text-slate-800 mb-4">Cài đặt hiển thị</h3>
                    <div class="space-y-4">
                        <div>
                            <label class="text-sm text-slate-600 block mb-2">Số sản phẩm trên 1 trang</label>
                            <select v-model="settings.productsPerPage"
                                class="w-full h-10 px-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none">
                                <option :value="12">12 sản phẩm</option>
                                <option :value="24">24 sản phẩm</option>
                                <option :value="48">48 sản phẩm</option>
                            </select>
                        </div>
                        <label class="flex items-center justify-between cursor-pointer">
                            <span class="text-sm text-slate-600">Hiển thị ảnh sản phẩm</span>
                            <input type="checkbox" v-model="settings.showProductImages"
                                class="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
                        </label>
                    </div>
                </div>
            </div>

            <!-- Payment Settings -->
            <div v-if="selectedCategory === 'payment'" class="space-y-4">
                <div class="bg-white rounded-lg border border-slate-200 p-5">
                    <h3 class="font-semibold text-slate-800 mb-4">Cài đặt thanh toán</h3>
                    <div class="space-y-4">
                        <label class="flex items-center justify-between cursor-pointer">
                            <span class="text-sm text-slate-600">Cho phép thanh toán công nợ</span>
                            <input type="checkbox" v-model="settings.allowDebt"
                                class="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
                        </label>
                        <label class="flex items-center justify-between cursor-pointer">
                            <span class="text-sm text-slate-600">Yêu cầu chọn khách hàng</span>
                            <input type="checkbox" v-model="settings.requireCustomer"
                                class="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
                        </label>
                    </div>
                </div>
            </div>

            <!-- Keyboard Shortcuts -->
            <div v-if="selectedCategory === 'shortcuts'" class="space-y-4">
                <div class="bg-white rounded-lg border border-slate-200 p-5">
                    <h3 class="font-semibold text-slate-800 mb-4">Phím tắt</h3>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between py-3 border-b border-slate-100">
                            <span class="text-slate-600">Thanh toán</span>
                            <kbd class="px-3 py-1.5 bg-slate-100 rounded text-slate-700 font-mono">F9</kbd>
                        </div>
                        <div class="flex justify-between py-3 border-b border-slate-100">
                            <span class="text-slate-600">In hóa đơn</span>
                            <kbd class="px-3 py-1.5 bg-slate-100 rounded text-slate-700 font-mono">F10</kbd>
                        </div>
                        <div class="flex justify-between py-3 border-b border-slate-100">
                            <span class="text-slate-600">Tìm sản phẩm</span>
                            <kbd class="px-3 py-1.5 bg-slate-100 rounded text-slate-700 font-mono">F3</kbd>
                        </div>
                        <div class="flex justify-between py-3">
                            <span class="text-slate-600">Tìm khách hàng</span>
                            <kbd class="px-3 py-1.5 bg-slate-100 rounded text-slate-700 font-mono">F4</kbd>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const selectedCategory = ref('print')

const categories = [
    { id: 'print', label: 'In hóa đơn', description: 'Cài đặt in ấn', icon: 'M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z' },
    { id: 'display', label: 'Hiển thị', description: 'Giao diện & layout', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { id: 'payment', label: 'Thanh toán', description: 'Phương thức & quy tắc', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { id: 'shortcuts', label: 'Phím tắt', description: 'Keyboard shortcuts', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4' },
]

const settings = ref({
    autoPrint: false,
    printDuplicate: false,
    productsPerPage: 24,
    showProductImages: true,
    allowDebt: true,
    requireCustomer: false,
})

function saveSettings() {
    console.log('Saving settings:', settings.value)
    // TODO: Save to backend
}
</script>
