import { onMounted, reactive, ref, type UnwrapRef } from 'vue'
import { ElMessage } from 'element-plus'
import { getApiErrorMessage, type ApiResponse } from '@/utils/request'

export type PaginatedListData<TItem> = {
  list: TItem[]
  total: number
  page?: number
  pageSize?: number
}

type PaginatedQueryOptions<
  TItem,
  TFilters extends Record<string, unknown>,
  TResult extends PaginatedListData<TItem>
> = {
  defaultFilters: TFilters
  pageSize?: number
  immediate?: boolean
  errorMessage?: string
  fetcher: (
    query: TFilters & { page: number; pageSize: number }
  ) => Promise<ApiResponse<TResult>>
  onLoaded?: (data: TResult) => void
}

export function usePaginatedQuery<
  TItem,
  TFilters extends Record<string, unknown>,
  TResult extends PaginatedListData<TItem> = PaginatedListData<TItem>
>(options: PaginatedQueryOptions<TItem, TFilters, TResult>) {
  const {
    defaultFilters,
    pageSize = 10,
    immediate = true,
    errorMessage = '获取列表失败',
    fetcher,
    onLoaded
  } = options

  const filters = reactive({ ...defaultFilters }) as UnwrapRef<TFilters>
  const pagination = reactive({
    page: 1,
    pageSize,
    total: 0
  })

  const loading = ref(false)
  const list = ref<TItem[]>([])

  const refresh = async () => {
    loading.value = true
    try {
      const res = await fetcher({
        ...(filters as TFilters),
        page: pagination.page,
        pageSize: pagination.pageSize
      })
      list.value = res.data.list
      pagination.total = res.data.total
      onLoaded?.(res.data)
    } catch (error) {
      ElMessage.error(getApiErrorMessage(error, errorMessage))
    } finally {
      loading.value = false
    }
  }

  const search = () => {
    pagination.page = 1
    void refresh()
  }

  const reset = () => {
    Object.assign(filters, defaultFilters)
    pagination.page = 1
    void refresh()
  }

  const handleSizeChange = () => {
    pagination.page = 1
    void refresh()
  }

  const adjustPageAfterDelete = () => {
    if (list.value.length <= 1 && pagination.page > 1) {
      pagination.page -= 1
    }
  }

  if (immediate) {
    onMounted(() => {
      void refresh()
    })
  }

  return {
    filters,
    pagination,
    loading,
    list,
    refresh,
    search,
    reset,
    handleSizeChange,
    adjustPageAfterDelete
  }
}
