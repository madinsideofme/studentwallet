const TOKEN_KEY = 'studentwallet_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

let onUnauthorized = null

export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn
}

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

const KNOWN_ERRORS = {
  'Invalid email or password': 'Incorrect email or password.',
  'Email already registered':
    'This email is already registered. Please log in.',
  'User is blocked':
    'Your account has been blocked. Contact the administrator.',
  'Unknown category': 'Choose a valid category.',
  'Not authenticated': 'Please log in.',
  'Invalid or expired token':
    'Your session has expired. Please log in again.',
}

function errorText(data, status) {
  const detail = data?.detail

  if (status >= 500) {
    return 'Server error. Please try again later.'
  }

  if (status === 422) {
    if (Array.isArray(detail)) {
      const messages = detail.map((issue) => {
        const field = issue.loc?.[issue.loc.length - 1]

        if (field === 'email') {
          return 'Enter a valid email address, for example name@example.com.'
        }

        if (field === 'password') {
          return 'Check your password. Registration requires at least 8 characters.'
        }

        if (field === 'amount' || field === 'limit_amount') {
          return 'Enter a valid amount greater than zero.'
        }

        if (field === 'spent_at') {
          return 'Enter a valid transaction date.'
        }

        if (field === 'category_id') {
          return 'Choose a valid category.'
        }

        if (field === 'month') {
          return 'Choose a valid month.'
        }

        return 'Check the information you entered.'
      })

      return messages.length
        ? [...new Set(messages)].join(' ')
        : 'Check the information you entered.'
    }

    return 'Check the information you entered.'
  }

  if (typeof detail === 'string') {
    return KNOWN_ERRORS[detail] || detail
  }

  return 'The request could not be completed. Please try again.'
}

async function request(
  path,
  { method = 'GET', body, auth = true } = {}
) {
  const headers = {}
  const token = getToken()

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  if (auth && token) {
    headers.Authorization = `Bearer ${token}`
  }

  let res

  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(
      0,
      'Cannot connect to the server. Please try again shortly.'
    )
  }

  if (res.status === 204) return null

  let data = null

  try {
    data = await res.json()
  } catch {
    data = null
  }

  if (!res.ok) {
    if (res.status === 401 && auth && token && onUnauthorized) {
      onUnauthorized()
    }

    throw new ApiError(res.status, errorText(data, res.status))
  }

  return data
}

export const api = {
  register: (data) =>
    request('/auth/register', {
      method: 'POST',
      body: data,
      auth: false,
    }),

  login: (data) =>
    request('/auth/login', {
      method: 'POST',
      body: data,
      auth: false,
    }),

  me: () => request('/auth/me'),

  categories: () => request('/categories'),
  createCategory: (data) =>
    request('/categories', {
      method: 'POST',
      body: data,
    }),

  expenses: (categoryId) =>
    request(
      `/expenses${categoryId
        ? `?category_id=${encodeURIComponent(categoryId)}`
        : ''
      }`
    ),

  addExpense: (data) =>
    request('/expenses', {
      method: 'POST',
      body: data,
    }),
  updateExpense: (id, data) =>
    request(`/expenses/${id}`, {
      method: 'PUT',
      body: data,
    }),
  deleteExpense: (id) =>
    request(`/expenses/${id}`, {
      method: 'DELETE',
    }),

  setBudget: (data) =>
    request('/budgets', {
      method: 'PUT',
      body: data,
    }),
  budgets: (month) =>
    request(`/budgets?month=${encodeURIComponent(month)}`),

  summary: (month) =>
    request(`/budget/summary?month=${encodeURIComponent(month)}`),
}