<script setup lang="ts">
import { z } from 'zod'
import { productService } from '@/services'

const schema = z.object({
  name: z.string().min(1, 'Tên sản phẩm là bắt buộc'),
  description: z.string().min(1, 'Mô tả là bắt buộc'),
  content: z.string().min(1, 'Nội dung là bắt buộc'),
  price: z.number().min(0, 'Giá phải lớn hơn hoặc bằng 0').optional(),
  sku: z.string().optional()
})

type Schema = z.output<typeof schema>

const open = ref(false)
const loading = ref(false)
const form = ref<Schema>({
  name: '',
  description: '',
  content: '',
  price: undefined,
  sku: ''
})

const toast = useToast()

async function onSubmit() {
  loading.value = true
  
  try {
    const productData = {
      name: form.value.name,
      description: form.value.description,
      content: form.value.content,
      price: form.value.price || undefined,
      sku: form.value.sku || undefined,
      isInStock: true,
      isFeatured: false
    }

    const response = await productService.createProduct(productData)
    
    if (response.success) {
      toast.add({
        title: 'Thành công',
        description: 'Sản phẩm đã được tạo thành công'
      })
      
      // Reset form and close modal
      form.value = { name: '', description: '', content: '', price: undefined, sku: '' }
      open.value = false
      
      // Emit event to refresh parent data if needed
      emit('created', response.data)
    } else {
      throw new Error(response.message)
    }
  } catch (error) {
    console.error('Failed to create product:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi tạo sản phẩm'
    toast.add({
      title: 'Lỗi',
      description: errorMessage,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

const emit = defineEmits<{
  created: [product: any]
}>()
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
          <UFormGroup label="Tên sản phẩm" name="name">
            <UInput
              v-model="form.name"
              placeholder="Nhập tên sản phẩm"
              :disabled="loading"
            />
          </UFormGroup>

          <UFormGroup label="Mô tả" name="description">
            <UTextarea
              v-model="form.description"
              placeholder="Nhập mô tả sản phẩm"
              :rows="3"
              :disabled="loading"
            />
          </UFormGroup>

          <UFormGroup label="Nội dung" name="content">
            <UTextarea
              v-model="form.content"
              placeholder="Nhập nội dung chi tiết"
              :rows="5"
              :disabled="loading"
            />
          </UFormGroup>

          <div class="grid grid-cols-2 gap-4">
            <UFormGroup label="Giá (VNĐ)" name="price">
              <UInput
                v-model.number="form.price"
                type="number"
                placeholder="0"
                :disabled="loading"
              />
            </UFormGroup>

            <UFormGroup label="SKU" name="sku">
              <UInput
                v-model="form.sku"
                placeholder="Mã sản phẩm"
                :disabled="loading"
              />
            </UFormGroup>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-4">
          <UButton
            label="Hủy"
            color="neutral"
            variant="subtle"
            :disabled="loading"
            @click="open = false"
          />
          <UButton
            type="submit"
            label="Tạo sản phẩm"
            color="primary"
            variant="solid"
            :loading="loading"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
