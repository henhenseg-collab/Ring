import api from './client'

export interface TokenResponse {
  access_token: string
  token_type: string
}

export const login = (email: string, password: string) => {
  const form = new URLSearchParams()
  form.append('username', email)
  form.append('password', password)
  return api
    .post<TokenResponse>('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    .then((r) => r.data)
}

export const register = (email: string, password: string) =>
  api.post<TokenResponse>('/auth/register', { email, password }).then((r) => r.data)
