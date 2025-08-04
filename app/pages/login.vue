<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { ref } from 'vue'

const { login } = useAuthService()

definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Login',
  description: 'Login to your account to continue'
})

const toast = useToast()

const fields = [{
  name: 'email',
  type: 'text' as const,
  label: 'Email',
  placeholder: 'Enter your email',
  required: true
}, {
  name: 'password',
  label: 'Password',
  type: 'password' as const,
  placeholder: 'Enter your password'
}]

const providers = [{
  label: 'Continue with Google',
  icon: 'i-simple-icons-google',
  color: 'neutral' as const,
  onClick: () => {
    toast.add({ title: 'Google', description: 'Login with Google' })
  }
}, {
  label: 'Continue with Youtube',
  icon: 'i-simple-icons-youtube',
  color: 'error' as const,
  onClick: () => {
    toast.add({ title: 'YouTube', description: 'Login with YouTube' })
  }
}, {
  label: 'Continue with Facebook',
  icon: 'i-simple-icons-facebook',
  color: 'success' as const,
  onClick: () => {
    toast.add({ title: 'Facebook', description: 'Login with Facebook' })
  }
}]

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Must be at least 8 characters')
})

type Schema = z.output<typeof schema>

const rememberMe = ref(false)

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  try {
    await login({
      email: payload.data.email, // Use email directly as API expects
      password: payload.data.password
    })
    // Login success handled by useAuthService (toast + redirect)
  } catch (err) {
    // Error handled by useAuthService
    console.error('Login failed:', err)
  }
}
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">
        Đăng nhập
      </h1>
    </div>

    <UAuthForm
      :fields="fields"
      :schema="schema"
      title=""
      class="custom-auth-form"
      :submit="{
        label: 'Đăng nhập'
      }"
      @submit="onSubmit"
    />

    <div class="flex items-center justify-between mt-2 mb-4">
      <label class="flex items-center text-gray-700 text-sm cursor-pointer select-none">
        <input
          v-model="rememberMe"
          type="checkbox"
          class="sr-only"
        >
        <span
          class="custom-checkbox-ui mr-2 flex items-center justify-center"
          :class="{ 'checked': rememberMe }"
        >
          <svg v-if="rememberMe" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 7L6 10L11 4" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
        Remember me
      </label>
      <ULink
        to="/"
        class="text-blue-500 hover:text-blue-600 text-sm"
        tabindex="-1"
      >
        Forgot password?
      </ULink>
    </div>

    <!-- Social Login Buttons -->
    <div class="mt-6">
      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300" />
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-white text-gray-500">Hoặc</span>
        </div>
      </div>

      <div class="mt-6 space-y-3">
        <!-- Google Button -->
        <UButton
          variant="outline"
          size="lg"
          block
          color="neutral"
          class="!text-gray-700 !h-[38px]"
          style="border-width: 0.7px; border-style: solid; border-color: rgb(207 207 207 / 50%); box-shadow: none;"
          @click="providers[0]?.onClick"
        >
          <span class="flex items-center justify-center">
            <svg class="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </span>
        </UButton>
        
        <!-- YouTube Button -->
        <UButton
          variant="outline"
          size="lg"
          block
          color="neutral"
          class="!text-gray-700 !h-[38px]"
          style="border-width: 0.7px; border-style: solid; border-color: rgb(207 207 207 / 50%); box-shadow: none;"
          @click="providers[1]?.onClick"
        >
          <span class="flex items-center justify-center">
            <svg class="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#ff0000" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            Continue with Youtube
          </span>
        </UButton>
        
        <!-- Facebook Button -->
        <UButton
          variant="outline"
          size="lg"
          block
          color="neutral"
          class="!text-gray-700 !h-[38px]"
          style="border-width: 0.7px; border-style: solid; border-color: rgb(207 207 207 / 50%); box-shadow: none;"
          @click="providers[2]?.onClick"
        >
          <span class="flex items-center justify-center">
            <svg class="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#1877f2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Continue with Facebook
          </span>
        </UButton>
      </div>
    </div>

    <!-- Sign up link -->
    <div class="text-center mt-6">
      <span class="text-gray-600">Chưa có tài khoản?</span>
      <ULink
        to="/signup"
        class="text-blue-500 hover:text-blue-600 font-medium ml-1"
      >
        Đăng ký ngay
      </ULink>
    </div>
  </div>
</template>

<style scoped>
.custom-auth-form :deep(input[type="text"]),
.custom-auth-form :deep(input[type="email"]),
.custom-auth-form :deep(input[type="password"]) {
  border-width: 0.7px !important;
  border-style: solid !important;
  border-color: rgb(207 207 207 / 50%) !important;
  box-shadow: none !important;
  background-color: white !important;
  height: 37px !important;
  padding: 0 12px !important;
}

.custom-auth-form :deep(input[type="text"]:focus),
.custom-auth-form :deep(input[type="email"]:focus),
.custom-auth-form :deep(input[type="password"]:focus) {
  border-color: rgb(207 207 207 / 70%) !important;
  box-shadow: none !important;
}

.custom-auth-form :deep(button[type="submit"]) {
  height: 37px !important;
}

.custom-checkbox {
  /* giữ lại cho input gốc, nhưng đã sr-only */
}
.custom-checkbox-ui {
  width: 18px;
  height: 18px;
  border-radius: 3px;
  background: white;
  box-shadow: none;
  border: 0.7px solid rgb(207 207 207 / 50%);
  transition: border-color 0.2s;
}
.custom-checkbox-ui.checked {
  border-color: #2563eb;
}
.custom-checkbox-ui:focus {
  outline: none;
  border-color: rgb(207 207 207 / 70%);
}
</style>
