<script setup lang="ts">
const enabledChatbot = ref(false)
const enabledAIHints = ref(true)
const provider = ref('OpenAI')
const providers = ['OpenAI', 'Azure OpenAI', 'Anthropic', 'Local']
</script>

<template>
  <div class="space-y-4">
    <UPageCard title="Chatbot AI và tính năng AI" variant="soft" class="bg-white rounded-lg">
      <div class="-mx-6 px-6 pt-4 border-t-1 border-gray-200 dark:border-gray-700 space-y-4">
        <div class="text-sm text-gray-700">
          Bật trợ lý AI để hỗ trợ chăm sóc khách hàng, gợi ý nội dung và tự động hoá một số thao tác trong hệ thống.
        </div>
        <div class="flex flex-col gap-3">
          <label class="inline-flex items-center gap-2 text-sm">
            <input v-model="enabledChatbot" type="checkbox">
            <span>Bật Chatbot AI</span>
          </label>
          <label class="inline-flex items-center gap-2 text-sm">
            <input v-model="enabledAIHints" type="checkbox">
            <span>Bật gợi ý thông minh (AI hints)</span>
          </label>
        </div>
        <div class="max-w-xs">
          <label class="block text-sm font-medium mb-1">Nhà cung cấp</label>
          <USelect
            v-model="provider"
            :items="providers"
          />
        </div>
        <div class="flex justify-end pt-2">
          <UButton
            color="primary"
            variant="solid"
            label="Lưu"
          />
        </div>
      </div>
    </UPageCard>
  </div>
</template>
