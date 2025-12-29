<template>
    <div class="h-full flex bg-slate-50">
        <!-- Sidebar -->
        <PosSidebar
            class="w-80 bg-white border-r border-slate-100 shadow-[4px_0_24px_-4px_rgba(0,0,0,0.02)] z-10 shrink-0 flex flex-col">
            <template #header>
                <div class="p-8 pb-4">
                    <div class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Hệ thống</div>
                    <div class="text-3xl font-bold tracking-tight text-slate-800 mb-2">Cấu hình POS</div>
                    <div class="text-sm text-slate-400 font-medium">Phiên bản 2.5.0</div>
                </div>
            </template>

            <div class="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Danh mục cài đặt
            </div>

            <div class="flex-1 overflow-y-auto w-full pb-4">
                <div v-for="category in categories" :key="category.id" @click="selectedCategory = category.id"
                    class="group relative flex items-center gap-5 px-8 py-5 cursor-pointer transition-all duration-200 border-l-4"
                    :class="selectedCategory === category.id
                        ? 'border-blue-600 bg-blue-50/50'
                        : 'border-transparent hover:bg-slate-50'">

                    <div class="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 shrink-0"
                        :class="selectedCategory === category.id
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-110'
                            : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:shadow-md'">
                        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                :d="category.iconPath" />
                        </svg>
                    </div>

                    <div class="flex-1">
                        <div class="font-bold text-[16px] mb-0.5 transition-colors"
                            :class="selectedCategory === category.id ? 'text-slate-800' : 'text-slate-500 group-hover:text-slate-700'">
                            {{ category.label }}
                        </div>
                        <div v-if="selectedCategory === category.id"
                            class="text-xs text-blue-600 font-medium animate-fade-in line-clamp-1">
                            {{ category.description }}
                        </div>
                    </div>
                </div>
            </div>
        </PosSidebar>

        <!-- Right Column -->
        <div class="flex-1 flex flex-col bg-slate-50 min-w-0">
            <!-- Header -->
            <div
                class="bg-white px-8 py-5 border-b border-slate-100 shrink-0 z-20 flex items-center justify-between shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)]">
                <div>
                    <h1 class="text-2xl font-bold text-slate-800 tracking-tight">
                        {{ activeCategory.label }}
                    </h1>
                    <p class="text-slate-500 text-sm mt-1 font-medium">{{ activeCategory.description }}</p>
                </div>

                <button @click="saveSettings"
                    class="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all duration-200">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Lưu thay đổi</span>
                </button>
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-y-auto p-8">
                <div class="max-w-4xl mx-auto space-y-8 pb-20">

                    <!-- General Settings -->
                    <div v-if="selectedCategory === 'general'" class="space-y-6">
                        <div class="bg-white rounded-2xl overflow-hidden">
                            <div class="px-8 py-6 flex items-center gap-3">
                                <div
                                    class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 class="text-lg font-bold text-slate-800">Thông tin cửa hàng</h3>
                                    <p class="text-sm text-slate-500">Thông tin hiển thị trên hóa đơn và phiếu in</p>
                                </div>
                            </div>

                            <div class="p-8 pt-0">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div class="md:col-span-1">
                                        <label class="block text-sm font-bold text-slate-700 mb-2">
                                            Tên cửa hàng <span class="text-red-500">*</span>
                                        </label>
                                        <PosInput v-model="settings.storeName" placeholder="Nhập tên cửa hàng"
                                            no-padding />
                                    </div>
                                    <div class="md:col-span-1">
                                        <label class="block text-sm font-bold text-slate-700 mb-2">
                                            Số điện thoại
                                        </label>
                                        <PosInput v-model="settings.storePhone" placeholder="VD: 0901234567"
                                            no-padding />
                                    </div>
                                    <div class="md:col-span-1">
                                        <label class="block text-sm font-bold text-slate-700 mb-2">
                                            Email liên hệ
                                        </label>
                                        <input v-model="settings.storeEmail" type="email"
                                            placeholder="VD: contact@brand.com"
                                            class="w-full h-11 px-4 rounded-xl border border-transparent bg-slate-100 text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all">
                                    </div>
                                    <div class="md:col-span-2">
                                        <label class="block text-sm font-bold text-slate-700 mb-2">
                                            Địa chỉ chi tiết
                                        </label>
                                        <input v-model="settings.storeAddress" type="text"
                                            placeholder="Nhập địa chỉ chi tiết"
                                            class="w-full h-11 px-4 rounded-xl border border-transparent bg-slate-100 text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Printer Settings -->
                    <div v-if="selectedCategory === 'print'" class="space-y-6">
                        <div class="bg-white rounded-2xl overflow-hidden">
                            <div class="px-8 py-6 flex items-center gap-3">
                                <div
                                    class="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 class="text-lg font-bold text-slate-800">Cấu hình in ấn</h3>
                                    <p class="text-sm text-slate-500">Máy in và mẫu hóa đơn</p>
                                </div>
                            </div>

                            <div class="p-8 pt-0 space-y-6">
                                <!-- Auto Print -->
                                <div
                                    class="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-colors">
                                    <div>
                                        <div class="font-bold text-slate-800 mb-1">In hóa đơn tự động</div>
                                        <div class="text-sm text-slate-500">Tự động in hóa đơn ngay sau khi thanh toán
                                        </div>
                                    </div>
                                    <label class="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" v-model="settings.autoPrint" class="sr-only peer">
                                        <div
                                            class="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600 shadow-inner">
                                        </div>
                                    </label>
                                </div>

                                <!-- Print Duplicate -->
                                <div
                                    class="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-colors">
                                    <div>
                                        <div class="font-bold text-slate-800 mb-1">In 2 liên (Merchant Copy)</div>
                                        <div class="text-sm text-slate-500">In thêm bản sao để lưu trữ</div>
                                    </div>
                                    <label class="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" v-model="settings.printDuplicate" class="sr-only peer">
                                        <div
                                            class="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600 shadow-inner">
                                        </div>
                                    </label>
                                </div>

                                <!-- Default Printer -->
                                <div>
                                    <label class="block text-sm font-bold text-slate-700 mb-2">Máy in mặc định</label>
                                    <PosDropdown v-model="settings.defaultPrinter" :options="printerOptions"
                                        value-key="value" display-key="label" placeholder="Chọn máy in" width="w-full"
                                        class="w-full">
                                        <template #trigger="{ display }">
                                            <div
                                                class="w-full h-11 px-4 flex items-center justify-between rounded-xl border border-transparent bg-slate-100 text-sm font-medium text-slate-800 hover:bg-white hover:border-blue-200 hover:shadow-sm cursor-pointer transition-all">
                                                <span>{{ display }}</span>
                                                <svg class="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24"
                                                    stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round"
                                                        stroke-width="2" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </template>
                                    </PosDropdown>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Sales Settings -->
                    <div v-if="selectedCategory === 'sales'" class="space-y-6">
                        <div class="bg-white rounded-2xl overflow-hidden">
                            <div class="px-8 py-6 flex items-center gap-3">
                                <div
                                    class="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 class="text-lg font-bold text-slate-800">Quy tắc bán hàng</h3>
                                    <p class="text-sm text-slate-500">Thanh toán và khách hàng</p>
                                </div>
                            </div>

                            <div class="p-8 pt-0 space-y-6">
                                <!-- Allow Debt -->
                                <div
                                    class="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-emerald-100 hover:bg-emerald-50/30 transition-colors">
                                    <div>
                                        <div class="font-bold text-slate-800 mb-1">Cho phép bán nợ</div>
                                        <div class="text-sm text-slate-500">Ghi nợ vào tài khoản khách nếu chưa trả đủ
                                        </div>
                                    </div>
                                    <label class="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" v-model="settings.allowDebt" class="sr-only peer">
                                        <div
                                            class="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500 shadow-inner">
                                        </div>
                                    </label>
                                </div>

                                <!-- Require Customer -->
                                <div
                                    class="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-emerald-100 hover:bg-emerald-50/30 transition-colors">
                                    <div>
                                        <div class="font-bold text-slate-800 mb-1">Bắt buộc chọn khách hàng</div>
                                        <div class="text-sm text-slate-500">Phải có khách hàng mới được thanh toán</div>
                                    </div>
                                    <label class="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" v-model="settings.requireCustomer" class="sr-only peer">
                                        <div
                                            class="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500 shadow-inner">
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Offline Settings -->
                    <div v-if="selectedCategory === 'offline'" class="space-y-6">
                        <div class="bg-white rounded-2xl overflow-hidden">
                            <div class="px-8 py-6 flex items-center gap-3">
                                <div
                                    class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 class="text-lg font-bold text-slate-800">Cấu hình Offline</h3>
                                    <p class="text-sm text-slate-500">Hoạt động khi không có kết nối mạng</p>
                                </div>
                            </div>

                            <div class="p-8 pt-0 space-y-6">
                                <!-- Enable Offline Mode -->
                                <div
                                    class="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-colors">
                                    <div>
                                        <div class="font-bold text-slate-800 mb-1">Chế độ bán hàng Offline</div>
                                        <div class="text-sm text-slate-500">Tiếp tục bán hàng và lưu đơn local khi mất
                                            kết nối
                                            internet</div>
                                    </div>
                                    <label class="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" v-model="settings.enableOfflineMode"
                                            class="sr-only peer">
                                        <div
                                            class="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-slate-600 shadow-inner">
                                        </div>
                                    </label>
                                </div>

                                <!-- Auto Sync -->
                                <div class="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                                    :class="{ 'opacity-50 pointer-events-none': !settings.enableOfflineMode }">
                                    <div>
                                        <div class="font-bold text-slate-800 mb-1">Tự động đồng bộ</div>
                                        <div class="text-sm text-slate-500">Tự động đẩy đơn hàng offline lên hệ thống
                                            khi có
                                            mạng trở lại</div>
                                    </div>
                                    <label class="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" v-model="settings.autoSync" class="sr-only peer"
                                            :disabled="!settings.enableOfflineMode">
                                        <div
                                            class="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-slate-600 shadow-inner">
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Display Settings -->
                    <div v-if="selectedCategory === 'display'" class="space-y-6">
                        <div class="bg-white rounded-2xl overflow-hidden">
                            <div class="px-8 py-6 flex items-center gap-3">
                                <div
                                    class="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 class="text-lg font-bold text-slate-800">Giao diện</h3>
                                    <p class="text-sm text-slate-500">Hiển thị và bố cục</p>
                                </div>
                            </div>

                            <div class="p-8 pt-0 space-y-8">
                                <!-- Grid Size -->
                                <div>
                                    <label class="block text-sm font-bold text-slate-700 mb-4">Kích thước lưới sản
                                        phẩm</label>
                                    <div class="grid grid-cols-3 gap-4">
                                        <div v-for="size in [12, 24, 48]" :key="size"
                                            @click="settings.productsPerPage = size"
                                            class="cursor-pointer relative group">
                                            <div class="absolute inset-0 bg-blue-600 rounded-xl opacity-0 transition-opacity duration-300"
                                                :class="{ 'opacity-5': settings.productsPerPage === size, 'group-hover:opacity-5': settings.productsPerPage !== size }">
                                            </div>
                                            <div class="border-2 rounded-xl p-4 flex flex-col items-center justify-center transition-all h-28"
                                                :class="settings.productsPerPage === size
                                                    ? 'border-blue-600 bg-blue-50/50'
                                                    : 'border-slate-100 bg-white group-hover:border-blue-200'">
                                                <span class="text-3xl font-black tracking-tight"
                                                    :class="settings.productsPerPage === size ? 'text-blue-600' : 'text-slate-700'">{{
                                                        size }}</span>
                                                <span class="text-[11px] font-bold uppercase mt-2 tracking-wide"
                                                    :class="settings.productsPerPage === size ? 'text-blue-500' : 'text-slate-400'">Sản
                                                    phẩm / Trang</span>
                                            </div>
                                            <div v-if="settings.productsPerPage === size"
                                                class="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full p-1 shadow-md">
                                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24"
                                                    stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round"
                                                        stroke-width="3" d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="border-t border-slate-100" />

                                <!-- Show Images -->
                                <div
                                    class="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-purple-100 hover:bg-purple-50/30 transition-colors">
                                    <div>
                                        <div class="font-bold text-slate-800 mb-1">Hiển thị hình ảnh sản phẩm</div>
                                        <div class="text-sm text-slate-500">Tắt hình để tăng hiệu suất trên thiết bị yếu
                                        </div>
                                    </div>
                                    <label class="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" v-model="settings.showProductImages"
                                            class="sr-only peer">
                                        <div
                                            class="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600 shadow-inner">
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Shortcut Settings -->
                    <div v-if="selectedCategory === 'shortcuts'">
                        <div class="bg-white rounded-2xl overflow-hidden">
                            <div class="px-8 py-6 flex items-center gap-3">
                                <div
                                    class="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 class="text-lg font-bold text-slate-800">Phím tắt</h3>
                                    <p class="text-sm text-slate-500">Danh sách phím tắt hệ thống</p>
                                </div>
                            </div>

                            <div class="p-8 pt-0">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div v-for="shortcut in shortcuts" :key="shortcut.key"
                                        class="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-orange-100 hover:shadow-sm transition-all">
                                        <span class="font-bold text-slate-700">{{ shortcut.label }}</span>
                                        <kbd
                                            class="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-black text-slate-800 shadow-sm font-mono min-w-[40px] text-center">{{
                                                shortcut.key }}</kbd>
                                    </div>
                                </div>
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
import PosSidebar from './PosSidebar.vue'
import PosDropdown from '~/components/pos/PosDropdown.vue'
import PosInput from '~/components/pos/PosInput.vue'

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
        enableOfflineMode: boolean
        autoSync: boolean
    }
}>()

const emit = defineEmits(['update:modelValue', 'save'])

const selectedCategory = ref('general')

const categories = [
    { id: 'general', label: 'Thông tin chung', description: 'Cửa hàng & liên hệ', iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'print', label: 'Máy in & Hóa đơn', description: 'Mẫu in, khổ giấy', iconPath: 'M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z' },
    { id: 'sales', label: 'Bán hàng', description: 'Quy tắc & thuế', iconPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'offline', label: 'Bán Offline', description: 'Đồng bộ & Lưu trữ', iconPath: 'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z' },
    { id: 'display', label: 'Giao diện', description: 'Hiển thị & bố cục', iconPath: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { id: 'shortcuts', label: 'Phím tắt', description: 'Keyboard shortcuts', iconPath: 'M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122' },
]

const printerOptions = [
    { value: 'none', label: 'Chưa chọn máy in' },
    { value: 'xp80', label: 'Xprinter XP-N160II (LAN)' },
    { value: 'epson', label: 'Epson TM-T82III (USB)' },
]

const shortcuts = [
    { label: 'Thanh toán', key: 'F9' },
    { label: 'Tìm kiếm sản phẩm', key: 'F3' },
    { label: 'Tìm khách hàng', key: 'F4' },
    { label: 'Sản phẩm tùy chỉnh', key: 'F2' },
    { label: 'Chiết khấu đơn hàng', key: 'F6' },
    { label: 'In lại hóa đơn gần nhất', key: 'F1' },
    { label: 'Bật/Tắt tự động in', key: 'F10' },
]

const activeCategory = computed(() => categories.find(c => c.id === selectedCategory.value) || categories[0]!)
const settings = computed(() => props.modelValue)

function saveSettings() {
    emit('save')
}
</script>