<template>
  <div class="min-h-screen flex flex-col bg-[#f6f7fb]">
    <!-- Header -->
    <header class="w-full flex items-center justify-between px-8 h-16 bg-white border-b" style="border-color: #e5e7eb;">
      <div class="">
        <img src="/zenweb.svg" alt="ZenWeb Logo" class="h-10 w-auto">
      </div>
    </header>

    <!-- Main content -->
    <main class="flex items-center justify-center px-8" style="height: calc(100vh - 128px);">
      <div class="bg-white rounded-lg max-w-5xl w-full overflow-hidden flex flex-col">
        <div class="flex flex-col lg:flex-row">
          <!-- Left side - Illustration -->
          <div class="lg:w-3/5 bg-white flex items-center justify-center p-8 lg:p-12 border-b lg:border-b-0 lg:border-r" style="border-color: #e5e7eb;">
            <div class="max-w-md text-left">
              <!-- Illustration placeholder -->
              <div class="mb-8">
                <img src="/welcome.png" alt="Welcome illustration" class="w-80 h-80 object-contain">
              </div>
              <h2 class="text-3xl font-bold text-gray-900 mb-4">
                Welcome To ZenWeb 🎉
              </h2>
              <p class="text-gray-600 leading-relaxed text-lg">
                ZenWeb mang đến giải pháp thiết kế web hiện đại, ứng dụng công nghệ mới nhất giúp doanh nghiệp và cá nhân xây dựng thương hiệu trực tuyến chuyên nghiệp, tối ưu trải nghiệm người dùng, bảo mật cao và dễ dàng mở rộng.
              </p>
            </div>
          </div>
          <!-- Right side - Login form -->
          <div class="lg:w-2/5 bg-white flex items-center justify-center p-8 lg:p-12">
            <div class="max-w-md w-full">
              <slot />
            </div>
          </div>
        </div>
        <!-- Footer removed from card -->
      </div>
    </main>
    <!-- Footer pinned bottom -->
    <footer class="w-full fixed bottom-0 left-0 border-t bg-white text-xs text-gray-500 h-16 z-50" style="border-color: #e5e7eb;">
      <div class="max-w-5xl mx-auto flex justify-between px-8 h-full items-center">
        <div class="flex items-center">
          <span>Copyright © 2025 ZenWeb. All rights reserved.</span>
        </div>
        <div class="flex items-center gap-4">
          <a href="#" class="hover:underline">Privacy Policy</a>
          <span class="text-gray-300">|</span>
          <a href="#" class="hover:underline">Terms and Conditions</a>
        </div>
      </div>
    </footer>
  </div>
</template>
