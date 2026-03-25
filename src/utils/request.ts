import { useUserStore } from '@/stores'
import router from '@/router'
import axios, { AxiosError, type AxiosRequestConfig, type Method } from 'axios'

const resolveBaseURL = () => {
  const rawBaseURL = import.meta.env.VITE_DEV_SERVER_URL?.trim()

  if (!rawBaseURL) return ''
  if (/\/api$/i.test(rawBaseURL)) return rawBaseURL

  return `${rawBaseURL.replace(/\/+$/, '')}/api`
}

const baseURL = resolveBaseURL()
const instance = axios.create({
  baseURL,
  timeout: 10000
})

instance.interceptors.request.use(
  (config) => {
    const store = useUserStore()
    if (store.user?.token && config.headers) {
      config.headers['Authorization'] = `Bearer ${store.user?.token}`
    }
    return config
  },
  (err) => Promise.reject(err)
)

instance.interceptors.response.use(
  (res) => {
    if (res.data?.code !== 200) {
      return Promise.reject(res.data)
    }
    return res.data
  },
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      const store = useUserStore()
      store.delUser()
      router.push(`/login?returnUrl=${router.currentRoute.value.fullPath}`)
    }
    return Promise.reject(err)
  }
)

export { baseURL, instance }

type Data<T> = {
  code: number
  message: string
  data: T
}

export const request = <T>(
  url: string,
  method: Method = 'get',
  submitData?: object,
  config?: AxiosRequestConfig
) => {
  const dataKey = method.toLowerCase() === 'get' ? 'params' : 'data'
  return instance.request<T, Data<T>>({
    url,
    method,
    ...config,
    [dataKey]: submitData
  })
}
