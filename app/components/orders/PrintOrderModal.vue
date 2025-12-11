<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from '@/components/base/BaseModal.vue'
import { ordersService } from '@/services/orders.service'

interface Props {
  modelValue?: boolean
  orderCode?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  orderCode: null
})

const emit = defineEmits<{
  'update:modelValue': [boolean]
}>()

const open = ref(props.modelValue)
const isLoading = ref(false)
const htmlContent = ref<string>('')
const errorMessage = ref<string | null>(null)
const previewFrame = ref<HTMLIFrameElement | null>(null)
const isDownloading = ref(false)

watch(() => props.modelValue, (val) => {
  open.value = val
})
watch(open, (val) => emit('update:modelValue', val))

async function fetchPreview() {
  const rawCode = props.orderCode || ''
  const code = rawCode.replace(/^#/, '').trim()
  if (!code) {
    errorMessage.value = 'Không xác định được mã đơn hàng'
    htmlContent.value = ''
    return
  }
  isLoading.value = true
  errorMessage.value = null
  htmlContent.value = ''
  try {
    const html = await ordersService.getOrderPrintPreviewHtml(code)
    htmlContent.value = html
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể tải nội dung in'
    errorMessage.value = message || 'Không thể tải nội dung in'
  } finally {
    isLoading.value = false
  }
}

watch(open, (val) => {
  if (val) {
    fetchPreview()
  } else {
    htmlContent.value = ''
    errorMessage.value = null
    isLoading.value = false
  }
})

function close() {
  open.value = false
}

function handlePrint() {
  if (!htmlContent.value) return
  const frame = previewFrame.value
  if (frame?.contentWindow) {
    frame.contentWindow.focus()
    frame.contentWindow.print()
    return
  }
  const win = window.open('', '_blank', 'noopener')
  if (win) {
    win.document.write(htmlContent.value)
    win.document.close()
    win.focus()
    win.print()
  }
}

async function handleDownload() {
  const rawCode = props.orderCode || ''
  const code = rawCode.replace(/^#/, '').trim()
  if (!code) {
    const toast = useToast()
    toast.add({
      title: 'Không thể tải về',
      description: 'Không xác định được mã đơn hàng',
      color: 'error'
    })
    return
  }
  isDownloading.value = true
  try {
    const blob = await ordersService.downloadOrderPrintPdf(code)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${code}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    const toast = useToast()
    const description = error instanceof Error ? error.message : 'Không thể tải file'
    toast.add({
      title: 'Tải về thất bại',
      description,
      color: 'error'
    })
  } finally {
    isDownloading.value = false
  }
}
</script>

<template>
  <BaseModal
    :model-value="open"
    title="In đơn hàng"
    width-class="max-w-5xl"
    body-class="px-0 py-0"
    @update:model-value="(v) => open = v"
  >
    <div class="min-h-[400px] flex flex-col">
      <div v-if="isLoading" class="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-gray-500">
        <UIcon name="i-lucide-loader-2" class="animate-spin text-3xl" />
        <p class="text-sm">Đang tải nội dung in...</p>
      </div>
      <div v-else-if="errorMessage" class="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
        <UIcon name="i-lucide-alert-triangle" class="text-3xl text-amber-500" />
        <div>
          <p class="text-base font-medium text-gray-900">Không thể tải nội dung in</p>
          <p class="text-sm text-gray-600 mt-1">{{ errorMessage }}</p>
        </div>
        <UButton color="primary" variant="solid" @click="fetchPreview">
          Thử lại
        </UButton>
      </div>
      <div
        v-else
        class="flex-1 border-t border-b border-gray-200 bg-gray-50"
      >
        <iframe
          ref="previewFrame"
          class="w-full h-[70vh] bg-white"
          :srcdoc="htmlContent || '<div class=\'p-6 text-center text-sm text-gray-500\'>Không có nội dung để hiển thị</div>'"
        />
      </div>
    </div>

    <template #footer>
      <UButton
        color="neutral"
        variant="soft"
        size="md"
        :disabled="!!errorMessage"
        :loading="isDownloading"
        @click="handleDownload"
      >
        Tải về PDF
      </UButton>
      <UButton
        color="primary"
        variant="solid"
        size="md"
        :disabled="!htmlContent || !!errorMessage"
        @click="handlePrint"
      >
        In ngay
      </UButton>
    </template>
  </BaseModal>
</template>
