'use client'

const USER_NAME_KEY = 'homebar_user_name'

export function getUserName(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(USER_NAME_KEY)
}

export function setUserName(name: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(USER_NAME_KEY, name)
}

export function clearUserName(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(USER_NAME_KEY)
}
