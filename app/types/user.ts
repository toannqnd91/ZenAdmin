/**
 * User types
 */

export interface User {
  id: number
  email: string
  name: string
  role: string
  avatar?: string
  createdAt?: string
  updatedAt?: string
}

export interface CreateUserRequest {
  email: string
  name: string
  password: string
  role?: string
}

export interface UpdateUserRequest {
  id: number
  email?: string
  name?: string
  role?: string
}

export interface UserProfile extends User {
  avatar?: string
  phone?: string
  address?: string
}
