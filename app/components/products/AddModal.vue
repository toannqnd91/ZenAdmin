<script setup lang="ts">
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1, 'Tiêu đề là bắt buộc'),
  desc: z.string().min(1, 'Mô tả là bắt buộc'),
  content: z.string().min(1, 'Nội dung là bắt buộc')
})

type Schema = z.output<typeof schema>

const open = ref(false)
const form = ref<Schema>({
  title: '',
  desc: '',
  content: ''
})

const toast = useToast()

async function onSubmit() {
  try {
    // TODO: API call to create product
    console.log('Creating product:', form.value)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    toast.add({
      title: 'Thành công',
      description: 'Sản phẩm đã được tạo thành công'
    })
    
    // Reset form and close modal
    form.value = { title: '', desc: '', content: '' }
    open.value = false
  } catch (error) {
    toast.add({
      title: 'Lỗi',
      description: 'Có lỗi xảy ra khi tạo sản phẩm',
      color: 'red'
    })
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Thêm sản phẩm mới"
    description="Tạo một sản phẩm mới trong hệ thống"
  >
    <slot @click="open = true" />

    <template #body>
      <UForm :schema="schema" :state="form" @submit="onSubmit">
        <div class="grid grid-cols-1 gap-4">
          <UFormGroup label="Tiêu đề" name="title">
            <UInput
              v-model="form.title"
              placeholder="Nhập tiêu đề sản phẩm"
              :disabled="false"
            />
          </UFormGroup>

          <UFormGroup label="Mô tả" name="desc">
            <UTextarea
              v-model="form.desc"
              placeholder="Nhập mô tả sản phẩm"
              :rows="3"
            />
          </UFormGroup>

          <UFormGroup label="Nội dung" name="content">
            <UTextarea
              v-model="form.content"
              placeholder="Nhập nội dung chi tiết"
              :rows="5"
            />
          </UFormGroup>
        </div>

        <div class="flex justify-end gap-2 pt-4">
          <UButton
            label="Hủy"
            color="neutral"
            variant="subtle"
            @click="open = false"
          />
          <UButton
            type="submit"
            label="Tạo sản phẩm"
            color="primary"
            variant="solid"
            loading-auto
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
