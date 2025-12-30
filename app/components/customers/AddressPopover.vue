<template>
    <div class="relative inline-block">
        <button @click="isOpen = !isOpen" class="text-gray-400 hover:text-gray-600" title="Thay đổi địa chỉ">
            <UIcon name="i-heroicons-pencil-square-20-solid" class="w-5 h-5" aria-hidden="true" />
        </button>

        <!-- Backdrop -->
        <div v-if="isOpen" @click="isOpen = false" class="fixed inset-0 z-40"></div>

        <!-- Dropdown Panel -->
        <Transition enter-active-class="transition ease-out duration-100"
            enter-from-class="transform opacity-0 scale-95" enter-to-class="transform opacity-100 scale-100"
            leave-active-class="transition ease-in duration-75" leave-from-class="transform opacity-100 scale-100"
            leave-to-class="transform opacity-0 scale-95">
            <div v-if="isOpen"
                class="absolute right-0 top-full mt-2 w-[400px] p-5 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                <!-- Header -->
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-gray-900">Thay đổi địa chỉ</h3>
                    <button @click="handleAddNew" class="text-sm text-primary-600 hover:text-primary-700 font-medium">
                        Thêm mới
                    </button>
                </div>

                <!-- Address List -->
                <div v-if="addresses.length > 0" class="space-y-3 max-h-96 overflow-y-auto overflow-x-hidden">
                    <div v-for="(addr, index) in addresses" :key="addr.id || index"
                        class="group relative py-3 cursor-pointer hover:bg-gray-50 rounded-lg px-3 -mx-3 transition-colors"
                        @click="handleSelect(addr)">

                        <!-- Address Content -->
                        <div class="pr-10 overflow-hidden">
                            <div class="font-medium text-base text-gray-900 mb-1 break-all">
                                {{ addr.contactName || 'Khách hàng' }}
                            </div>
                            <div class="text-sm text-gray-500 leading-relaxed break-all"
                                style="overflow-wrap: anywhere;">
                                {{ formatAddress(addr) }}
                            </div>

                            <!-- Default text (instead of badge) -->
                            <div v-if="addr.isDefault" class="mt-1">
                                <span class="text-xs text-gray-400">
                                    Địa chỉ mặc định
                                </span>
                            </div>
                        </div>

                        <!-- Edit Button - Always visible -->
                        <button @click.stop="handleEdit(addr)"
                            class="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors">
                            <UIcon name="i-heroicons-pencil-square" class="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <!-- Empty State -->
                <div v-else class="py-8 text-center">
                    <div class="text-gray-400 text-sm mb-2">Chưa có địa chỉ</div>
                    <button @click="handleAddNew" class="text-sm text-primary-600 hover:text-primary-700 font-medium">
                        Thêm địa chỉ mới
                    </button>
                </div>
            </div>
        </Transition>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Address {
    id?: number
    addressLine1?: string | null
    addressLine2?: string | null
    city?: string | null
    wardName?: string | null
    districtName?: string | null
    stateOrProvinceName?: string | null
    countryName?: string | null
    zipCode?: string | null
    phoneNumber?: string | null
    contactName?: string | null
    isDefault?: boolean
}

interface Props {
    addresses: Address[]
}

defineProps<Props>()

const emit = defineEmits<{
    select: [address: Address]
    edit: [address: Address]
    'add-new': []
}>()

const isOpen = ref(false)

function formatAddress(addr: Address): string {
    const parts = [
        addr.addressLine1,
        addr.wardName,
        addr.districtName,
        addr.stateOrProvinceName
    ].filter(Boolean)

    return parts.join(', ') || 'Địa chỉ mặc định'
}

function handleSelect(addr: Address) {
    emit('select', addr)
    isOpen.value = false
}

function handleEdit(addr: Address) {
    emit('edit', addr)
    isOpen.value = false
}

function handleAddNew() {
    emit('add-new')
    isOpen.value = false
}
</script>
