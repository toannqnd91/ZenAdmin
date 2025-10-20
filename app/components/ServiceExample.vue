<template>
  <div>
    <h2>Service Repository Pattern Example</h2>

    <!-- Products Section -->
    <UCard class="mb-4">
      <template #header>
        <div class="flex justify-between items-center">
          <h3>Products (Using Service)</h3>
          <UButton :loading="loading" @click="createSampleProduct">
            Create Sample Product
          </UButton>
        </div>
      </template>

      <div class="space-y-2">
        <UInput
          v-model="q"
          placeholder="Search products..."
          icon="i-lucide-search"
        />

        <div v-if="loading" class="text-center py-4">
          <UIcon name="i-lucide-loader-2" class="animate-spin" />
          Loading products...
        </div>

        <div v-else-if="error" class="text-red-500">
          Error: {{ error.message }}
        </div>

        <div v-else class="grid gap-2">
          <UCard v-for="product in filteredProducts" :key="product.id" class="p-3">
            <div class="flex justify-between items-start">
              <div>
                <h4 class="font-medium">
                  {{ product.name }}
                </h4>
                <p class="text-sm text-gray-600">
                  {{ truncateText(product.description) }}
                </p>
                <p class="text-sm font-medium text-green-600">
                  {{ product.price ? `$${product.price}` : 'Free' }}
                </p>
              </div>
              <div class="flex gap-2">
                <UButton size="xs" @click="editProduct(product)">
                  Edit
                </UButton>
                <UButton size="xs" color="error" @click="deleteProductItem(product.id)">
                  Delete
                </UButton>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </UCard>

    <!-- News Section -->
    <UCard>
      <template #header>
        <div class="flex justify-between items-center">
          <h3>News (Using Service)</h3>
          <UButton :loading="newsLoading" @click="createSampleNews">
            Create Sample News
          </UButton>
        </div>
      </template>

      <div class="space-y-2">
        <div class="flex gap-2">
          <UInput
            v-model="newsQuery"
            placeholder="Search news..."
            icon="i-lucide-search"
            class="flex-1"
          />
          <USelect
            v-model="selectedCategory"
            :options="categoryOptions"
            placeholder="All Categories"
          />
        </div>

        <div v-if="newsLoading" class="text-center py-4">
          <UIcon name="i-lucide-loader-2" class="animate-spin" />
          Loading news...
        </div>

        <div v-else class="grid gap-2">
          <UCard v-for="newsItem in filteredNews" :key="newsItem.id" class="p-3">
            <div class="flex justify-between items-start">
              <div>
                <h4 class="font-medium">
                  {{ newsItem.title }}
                </h4>
                <p class="text-sm text-gray-600">
                  {{ truncateContent(newsItem.description) }}
                </p>
                <p class="text-xs text-gray-500">
                  {{ formatDate(newsItem.publishDate) }} • {{ newsItem.category?.name }}
                </p>
              </div>
              <div class="flex gap-2">
                <UButton size="xs" @click="editNews(newsItem)">
                  Edit
                </UButton>
                <UButton size="xs" color="error" @click="deleteNewsItem(newsItem.id)">
                  Delete
                </UButton>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { useProductsService } from '@/composables/useProductsService'
import { useNewsService } from '@/composables/useNewsService'

// Products
const {
  q,
  products,
  filtered: filteredProducts,
  loading,
  error,
  createProduct,
  updateProduct,
  deleteProduct,
  truncateText
} = useProductsService()

// News
const {
  q: newsQuery,
  selectedCategoryId,
  news,
  categories,
  filteredNews,
  loading: newsLoading,
  createNews,
  updateNews,
  deleteNews,
  formatDate,
  truncateContent
} = useNewsService()

// Computed
const selectedCategory = computed({
  get: () => selectedCategoryId.value?.toString() || '',
  set: (value: string) => {
    selectedCategoryId.value = value ? parseInt(value) : null
  }
})

const categoryOptions = computed(() => [
  { value: '', label: 'All Categories' },
  ...categories.value.map(cat => ({
    value: cat.id.toString(),
    label: cat.name
  }))
])

// Methods
async function createSampleProduct() {
  try {
    await createProduct({
      name: `Sample Product ${Date.now()}`,
      description: 'This is a sample product created using the service pattern',
      content: 'Detailed content about the sample product...',
      price: Math.floor(Math.random() * 1000),
      sku: `SKU-${Date.now()}`,
      isFeatured: Math.random() > 0.5,
      isInStock: true
    })
  } catch (error) {
    console.error('Failed to create product:', error)
  }
}

async function editProduct(product: any) {
  try {
    await updateProduct(product.id, {
      name: `${product.name} (Updated)`,
      price: product.price ? product.price + 10 : 10
    })
  } catch (error) {
    console.error('Failed to update product:', error)
  }
}

async function deleteProductItem(id: number) {
  if (confirm('Are you sure you want to delete this product?')) {
    await deleteProduct(id)
  }
}

async function createSampleNews() {
  try {
    const firstCategory = categories.value[0]
    if (!firstCategory) {
      alert('Please create a news category first')
      return
    }

    await createNews({
      title: `Sample News ${Date.now()}`,
      description: 'This is a sample news created using the service pattern',
      content: 'Detailed content for the sample news article...',
      categoryId: firstCategory.id,
      isPublished: true
    })
  } catch (error) {
    console.error('Failed to create news:', error)
  }
}

async function editNews(newsItem: any) {
  try {
    await updateNews(newsItem.id, {
      title: `${newsItem.title} (Updated)`,
      description: `${newsItem.description} (Updated at ${new Date().toLocaleTimeString()})`
    })
  } catch (error) {
    console.error('Failed to update news:', error)
  }
}

async function deleteNewsItem(id: number) {
  if (confirm('Are you sure you want to delete this news?')) {
    await deleteNews(id)
  }
}
</script>
