const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean>
}

class ApiClient {
  private getHeaders(customHeaders?: HeadersInit): Headers {
    const headers = new Headers(customHeaders)
    if (!headers.has('Content-Type') && !(customHeaders instanceof Headers)) {
      headers.set('Content-Type', 'application/json')
    }

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      }
    }

    return headers
  }

  private async request<T>(path: string, options: FetchOptions = {}): Promise<T> {
    const headers = this.getHeaders(options.headers)
    let url = `${API_BASE_URL}${path}`

    if (options.params) {
      const searchParams = new URLSearchParams()
      Object.entries(options.params).forEach(([key, val]) => {
        searchParams.append(key, String(val))
      })
      url += `?${searchParams.toString()}`
    }

    const config: RequestInit = {
      ...options,
      headers,
    }

    const response = await fetch(url, config)

    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
      throw new Error('Unauthorized')
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Request failed with status ${response.status}`)
    }

    if (response.status === 204) {
      return {} as T
    }

    return response.json()
  }

  async get<T>(path: string, options?: FetchOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' })
  }

  async post<T>(path: string, body?: any, options?: FetchOptions): Promise<T> {
    const config: FetchOptions = { ...options, method: 'POST' }
    if (body !== undefined) {
      config.body = JSON.stringify(body)
    }
    return this.request<T>(path, config)
  }

  async put<T>(path: string, body?: any, options?: FetchOptions): Promise<T> {
    const config: FetchOptions = { ...options, method: 'PUT' }
    if (body !== undefined) {
      config.body = JSON.stringify(body)
    }
    return this.request<T>(path, config)
  }

  async patch<T>(path: string, body?: any, options?: FetchOptions): Promise<T> {
    const config: FetchOptions = { ...options, method: 'PATCH' }
    if (body !== undefined) {
      config.body = JSON.stringify(body)
    }
    return this.request<T>(path, config)
  }

  async delete<T>(path: string, options?: FetchOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' })
  }
}

export const api = new ApiClient()
export default api
