<script setup lang="ts">
definePageMeta({ layout: false })

const q = ref('')
</script>

<template>
  <!-- Fullscreen POS Layout -->
  <div class="min-h-[100dvh] w-full bg-white flex flex-col">
    <!-- Top blue bar -->
    <header class="h-14 bg-[#0b5bd3] text-white flex items-center px-4 gap-3">
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <!-- Logo placeholder -->
        <div class="w-7 h-7 rounded bg-white/20 flex items-center justify-center text-white font-bold">
          S
        </div>
        <!-- Search -->
        <div class="relative flex-1 min-w-0 max-w-[640px]">
          <input
            v-model="q"
            type="text"
            placeholder="Nhập tên sản phẩm hoặc mã SKU  F3"
            class="w-full h-9 rounded bg-white/95 text-gray-900 pl-10 pr-3 placeholder:text-gray-500 shadow-sm focus:outline-none"
          >
          <span class="absolute inset-y-0 left-3 flex items-center text-gray-500">
            <svg
              class="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </span>
        </div>
        <!-- Tabs: Đơn 1 + -->
        <div class="flex items-center bg-white/15 rounded text-white">
          <button class="px-3 h-9 inline-flex items-center gap-2 rounded-l hover:bg-white/20">
            Đơn 1
          </button>
          <button class="px-2 h-9 inline-flex items-center rounded-r hover:bg-white/20">
            <svg
              class="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      </div>
      <!-- Right status icons -->
      <div class="flex items-center gap-3">
        <button class="h-8 px-2 inline-flex items-center gap-2 rounded bg-white/15 hover:bg-white/20">
          <svg
            class="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M12 2v20M2 12h20" />
          </svg>
        </button>
        <div class="text-xs leading-tight text-white/90">
          <div class="font-medium">
            Chi nhánh
          </div>
          <div class="opacity-90">
            Cửa hàng chính
          </div>
        </div>
        <button class="h-8 w-8 rounded-full bg-white/20" />
      </div>
    </header>

    <!-- Body: left side icons + main area + right summary -->
    <div class="flex-1 min-h-0 flex">
      <!-- Left vertical icons -->
      <aside class="w-14 border-r bg-white flex flex-col items-center py-3 gap-4">
        <button class="w-9 h-9 rounded hover:bg-gray-100 inline-flex items-center justify-center">
          <svg
            class="w-5 h-5 text-gray-700"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M3 7h18M3 12h18M3 17h18" />
          </svg>
        </button>
        <button class="w-9 h-9 rounded hover:bg-gray-100 inline-flex items-center justify-center">
          <svg
            class="w-5 h-5 text-gray-700"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M3 4h18v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4z" />
          </svg>
        </button>
      </aside>

      <!-- Main center panel -->
      <main class="flex-1 min-w-0 flex flex-col">
        <!-- Header row for product table -->
        <div class="h-11 border-b flex items-center px-4 text-gray-600 text-sm select-none">
          <div class="flex-1">
            Sản phẩm (0)
          </div>
          <label class="inline-flex items-center gap-2 ml-6">
            <input type="checkbox" class="rounded border-gray-300">
            <span>Tách dòng sản phẩm</span>
          </label>
        </div>

        <!-- Empty state -->
        <div class="flex-1 min-h-0 grid grid-cols-12">
          <div class="col-span-9 flex items-center justify-center">
            <div class="text-center text-gray-500">
              <div class="mx-auto w-24 h-24 rounded bg-gray-100 flex items-center justify-center mb-3">
                <svg
                  class="w-10 h-10 text-gray-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M3 7h18M3 12h18M3 17h18" />
                </svg>
              </div>
              <div class="mb-1">
                Bạn chưa thêm sản phẩm nào
              </div>
              <div class="text-sm">
                Ấn <span class="px-1 rounded bg-gray-200">F3</span> để tìm kiếm nhanh sản phẩm
              </div>
            </div>
          </div>
          <!-- Right summary panel -->
          <div class="col-span-3 border-l flex flex-col">
            <div class="p-3 border-b">
              <div class="relative">
                <input type="text" placeholder="Tìm kiếm khách hàng  F4" class="w-full h-9 rounded border border-gray-300 pl-3 pr-10 text-sm">
                <span class="absolute inset-y-0 right-3 flex items-center text-gray-400">
                  <svg
                    class="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </div>
            </div>

            <div class="p-3 text-sm text-gray-700 space-y-1">
              <div class="flex justify-between">
                <span>Tổng tiền hàng (0 sản phẩm)</span><span>0đ</span>
              </div>
              <div class="flex justify-between text-primary-600">
                <button class="inline-flex items-center gap-1">
                  <span>Giảm giá</span>
                  <span class="text-[10px] px-1 rounded bg-blue-100 text-blue-700">F6</span>
                </button><span>0đ</span>
              </div>
              <div class="flex justify-between font-semibold text-gray-900">
                <span>Khách phải trả</span><span>0đ</span>
              </div>
            </div>

            <div class="mt-auto p-3 space-y-2">
              <label class="inline-flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" class="rounded border-gray-300" checked>
                <span>In hoá đơn tự động  <span class="text-[10px] px-1 rounded bg-gray-100 text-gray-600">F10</span></span>
              </label>
              <button class="h-11 w-full rounded bg-primary-600 hover:bg-primary-700 text-white font-semibold">
                Thanh toán  <span class="text-[10px] px-1 rounded bg-blue-100 text-white/90 ml-1">F9</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Bottom toolbar -->
        <div class="h-16 border-t px-3 flex items-center gap-3 text-sm">
          <button class="h-9 inline-flex items-center gap-2 rounded border border-amber-300 bg-amber-50 px-3 text-amber-800">
            Sapo Invoice <span class="text-xs font-medium text-amber-700">Cần thiết lập mẫu hoá đơn</span>
          </button>
          <button class="h-9 inline-flex items-center gap-2 rounded border border-sky-300 bg-sky-50 px-3 text-sky-800">
            Quản lý công nợ <span class="text-xs font-medium text-sky-700">Chưa thêm khách hàng</span>
          </button>
          <div class="flex-1 min-w-0">
            <input type="text" placeholder="Nhập ghi chú đơn hàng" class="w-full h-9 rounded border border-gray-300 px-3">
          </div>
          <div class="flex items-center gap-2">
            <label class="text-gray-700">Nhân viên:</label>
            <button class="h-9 inline-flex items-center gap-2 rounded border border-gray-300 px-3 hover:bg-gray-50">
              Phạm Văn Toàn
              <svg
                class="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          </div>
          <button class="h-9 inline-flex items-center gap-2 rounded border border-gray-300 px-3 hover:bg-gray-50">
            Sản phẩm tuỳ chỉnh  <span class="text-[10px] px-1 rounded bg-gray-100 text-gray-600">F2</span>
          </button>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.bg-primary-600{ background-color: #1b64f2; }
.bg-primary-700{ background-color: #155ae0; }
.text-primary-600{ color: #1b64f2; }
</style>
