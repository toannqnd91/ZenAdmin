<script setup lang="ts">
import { computed } from 'vue'

type Category = { id: string | number; name: string }
type Variation = { id: string | number; stockQuantity: number | null }
type ProductItem = {
  id: string | number
  name: string
  thumbnailImageUrl?: string | null
  categories?: Category[]
  status?: 'Public' | 'Draft'
  source?: string
  sold?: number
  stockQuantity?: number | null
  variations?: Variation[]
  createdOn?: string | Date
}

interface Props {
  data: ProductItem[]
  q: string
  rowSelection: Record<string, boolean>   // id -> selected
  pagination: { pageIndex: number; pageSize: number }
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:q':[string]
  'update:rowSelection':[Record<string,boolean>]
  'update:pagination':[ { pageIndex:number; pageSize:number } ]
}>()

/* ---------- filter + paging ---------- */
const filtered = computed(() =>
  (props.data||[]).filter(p =>
    (p.name||'').toLowerCase().includes((props.q||'').toLowerCase())
  )
)
const start = computed(()=> props.pagination.pageIndex * props.pagination.pageSize)
const end   = computed(()=> start.value + props.pagination.pageSize)
const pageItems = computed(()=> filtered.value.slice(start.value, end.value))

/* ---------- selection state ---------- */
const isSelected = (id: string|number) => !!props.rowSelection?.[String(id)]
const setRowSelected = (id: string|number, v:boolean) => {
  const next = { ...(props.rowSelection||{}) }
  next[String(id)] = v
  emit('update:rowSelection', next)
}
const selectedCount = computed(()=> Object.values(props.rowSelection||{}).filter(Boolean).length)

const pageAllSelected  = computed(()=> pageItems.value.length>0 && pageItems.value.every(it=>isSelected(it.id)))
const pageSomeSelected = computed(()=> pageItems.value.some(it=>isSelected(it.id)))
const selectAllState   = computed<'none'|'some'|'all'>(() =>
  pageAllSelected.value ? 'all' : (pageSomeSelected.value ? 'some' : 'none')
)

const toggleAllPage = () => {
  const targetValue = !(selectAllState.value === 'all')
  const next = { ...(props.rowSelection||{}) }
  for (const it of pageItems.value) next[String(it.id)] = targetValue
  emit('update:rowSelection', next)
}

/* ---------- navigation by row click ---------- */
const goto = (id: string|number)=> navigateTo(`/products/${id}/update`)
const onBodyClick = (e: Event)=>{
  const t = e.target as HTMLElement
  if (t.closest('[data-role="chk"]') || t.closest('button') || t.closest('[role="button"]')) return
  const tr = t.closest('tbody tr') as HTMLTableRowElement | null
  if (!tr) return
  const idx = Array.from(tr.parentElement!.children).indexOf(tr)
  const item = pageItems.value[idx]
  if (item) goto(item.id)
}

/* ---------- helpers ---------- */
const invText = (p: ProductItem) => {
  if (Array.isArray(p.variations) && p.variations.length>1) {
    const qty = p.variations.map(v=>v.stockQuantity)
    const allU = qty.every(q=>q==null)
    const allS = qty.every(q=>q===qty[0])
    if (allU) return { line1:'Unlimited', variants: `${p.variations.length} variants`, danger:false }
    if (allS) return { line1:`${qty[0]} in stock`, variants: `${p.variations.length} variants`, danger:false }
    return { line1:'Mixed', variants:`${p.variations.length} variants`, danger:true }
  }
  if (p.stockQuantity==null) return { line1:'Unlimited', variants:`${Array.isArray(p.variations)?p.variations.length:1} variants`, danger:false }
  return { line1:`${p.stockQuantity} in stock`, variants:`${Array.isArray(p.variations)?p.variations.length:1} variants`, danger:false }
}

/* ---------- keyboard helpers ---------- */
const onCheckboxKey = (e: KeyboardEvent, handler: () => void) => {
  if (e.code === 'Space' || e.key === ' ') {
    e.preventDefault()
    handler()
  }
}
</script>

<template>
  <div class="bg-white border-gray-200">
    <!-- Top bar -->
    <div class="flex items-center justify-between gap-3 px-6 py-5">
      <h2 class="text-lg font-semibold">Danh sách sản phẩm</h2>

      <div class="flex items-center gap-3">
        <button
          class="h-9 w-9 inline-flex items-center justify-center rounded-md
                border border-gray-300 bg-white hover:bg-gray-50
                focus:outline-none focus:ring-2 focus:ring-blue-400"
          style="aspect-ratio: 1 / 1 !important;"
          title="Filter" aria-label="Filter"
        >
          <svg class="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 3h12v4l-4 4v8l-4-2v-6l-4-4V3z"/>
          </svg>
        </button>

        <div class="relative w-full max-w-xs">
          <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-500">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
          </span>
          <input
            type="text"
            placeholder="Search Products"
            class="h-9 w-full pl-9 pr-3 rounded-md border border-gray-300 bg-white placeholder:text-gray-400 text-gray-800 focus:outline-none focus:border-gray-400 focus:ring-0 text-sm"
            :value="q"
            @input="$emit('update:q', ($event.target as HTMLInputElement).value)"
          />
        </div>

        <button
          class="h-9 px-4 inline-flex items-center gap-2 rounded-md bg-[#1b64f2] hover:bg-[#155ae0] text-white font-medium whitespace-nowrap"
          @click="navigateTo('/products/create')"
        >
          Thêm sản phẩm
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>
    </div>

    <div class="border-t border-gray-200"></div>

    <!-- Selection toolbar -->
    <div v-if="selectedCount > 0" class="px-6 py-3 border-b border-gray-200">
      <div class="flex items-center">
        <div class="w-14 h-full flex items-center justify-center">
          <button
            type="button"
            class="inline-flex items-center justify-center h-5 w-5 rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-1
                   bg-[#1b64f2] border-[#1b64f2] text-white"
            aria-label="Toggle all on page"
            @click="toggleAllPage"
          >
            <svg v-if="selectAllState!=='all'" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M5 12h14"/></svg>
            <svg v-else class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
        </div>

        <span class="text-lg font-medium ml-2">{{ selectedCount }} selected</span>

        <div class="flex items-center gap-2 ml-6">
          <button type="button"
            class="h-9 inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 text-sm bg-white hover:bg-gray-50">
            Change Status
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
          </button>

          <button type="button"
            class="h-9 inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 text-sm bg-white hover:bg-gray-50">
            Archived
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="4"/><path d="M8 8v12h8V8"/></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="px-6" @click="onBodyClick">
      <table class="w-full table-fixed">
        <!-- thead hidden when any selected -->
        <thead v-show="selectedCount === 0" class="text-gray-500">
          <tr>
            <th class="py-3 w-14">
              <div class="w-14 h-full flex items-center justify-center">
                <button
                  data-role="chk"
                  type="button"
                  role="checkbox"
                  :aria-checked="selectAllState==='all' ? 'true' : (selectAllState==='some' ? 'mixed' : 'false')"
                  :class="[
                    'inline-flex items-center justify-center h-5 w-5 rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-1',
                    selectAllState==='none'
                      ? 'bg-white border-gray-300 text-gray-400 focus:ring-blue-400'
                      : 'bg-[#1b64f2] border-[#1b64f2] text-white focus:ring-blue-400'
                  ]"
                  @click="toggleAllPage"
                  @keydown="onCheckboxKey($event, toggleAllPage)"
                  :title="selectAllState==='all' ? 'Unselect all' : 'Select all'"
                >
                  <svg v-if="selectAllState==='all'" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <svg v-else-if="selectAllState==='some'" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" stroke-width="3" stroke-linecap="round">
                    <path d="M5 12h14"/>
                  </svg>
                </button>
              </div>
            </th>
            <th class="py-3 text-left font-medium">Product name</th>
            <th class="py-3 text-left font-medium">Status</th>
            <th class="py-3 text-left font-medium">Sources</th>
            <th class="py-3 text-left font-medium">Sold</th>
            <th class="py-3 text-left font-medium">Inventory</th>
            <th class="py-3 text-right font-medium pr-4"> </th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="p in pageItems" :key="p.id"
              class="group/row border-t border-gray-200 hover:bg-gray-50">
            <!-- Row checkbox -->
            <td class="py-4 w-14 align-middle">
              <div class="w-14 h-full flex items-center justify-center">
                <button
                  data-role="chk"
                  type="button"
                  role="checkbox"
                  :aria-checked="isSelected(p.id) ? 'true' : 'false'"
                  :class="[
                    'inline-flex items-center justify-center h-5 w-5 rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-1',
                    isSelected(p.id)
                      ? 'bg-[#1b64f2] border-[#1b64f2] text-white focus:ring-blue-400'
                      : 'bg-white border-gray-300 text-gray-400 focus:ring-blue-400'
                  ]"
                  @click="setRowSelected(p.id, !isSelected(p.id))"
                  @keydown="onCheckboxKey($event, () => setRowSelected(p.id, !isSelected(p.id)))"
                >
                  <svg v-if="isSelected(p.id)" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </button>
              </div>
            </td>

            <!-- name + thumb -->
            <td class="py-4">
              <div class="flex items-center gap-4">
                <div class="h-14 w-14 rounded-md bg-gray-100 overflow-hidden flex items-center justify-center">
                  <img :src="p.thumbnailImageUrl || '/no-image.svg'" :alt="p.name"
                       class="h-full w-full object-cover"
                       @error="(e:any)=> e.target && (e.target.src='/no-image.svg')" />
                </div>
                <div class="text-[15px] text-gray-900 font-medium">{{ p.name }}</div>
              </div>
            </td>

            <!-- status pill -->
            <td class="py-4">
              <span class="inline-flex items-center rounded-full bg-[#dff5c7] text-[#2a7a16] px-3 py-1 text-sm font-medium">
                {{ p.status || 'Public' }}
              </span>
            </td>

            <!-- source -->
            <td class="py-4 text-gray-700">{{ p.source || 'My product' }}</td>

            <!-- sold -->
            <td class="py-4 text-gray-900">{{ p.sold ?? 0 }}</td>

            <!-- inventory -->
            <td class="py-4">
              <div :class="['text-gray-900', invText(p).danger ? 'text-red-500' : '']">
                {{ invText(p).line1 }}
              </div>
              <div class="text-xs text-gray-400">{{ invText(p).variants }}</div>
            </td>

            <!-- actions -->
            <td class="py-4 pr-4">
              <div class="flex justify-end">
                <button type="button" class="h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-gray-100" @click.stop>
                  <svg class="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="6" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="18" r="1"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="h-6 border-t border-gray-200"></div>
    </div>

    <!-- Footer -->
    <div class="flex items-center justify-between px-6 pb-4">
      <div class="text-sm text-gray-500">{{ selectedCount }} selected.</div>
      <div class="flex items-center gap-2">
        <button class="px-3 py-1.5 border rounded-md text-sm"
                :disabled="pagination.pageIndex===0"
                @click="$emit('update:pagination', { ...pagination, pageIndex: pagination.pageIndex-1 })">Prev</button>
        <span class="text-sm">Page {{ pagination.pageIndex + 1 }}</span>
        <button class="px-3 py-1.5 border rounded-md text-sm"
                :disabled="(pagination.pageIndex + 1) * pagination.pageSize >= filtered.length"
                @click="$emit('update:pagination', { ...pagination, pageIndex: pagination.pageIndex+1 })">Next</button>
      </div>
    </div>
  </div>
</template>
