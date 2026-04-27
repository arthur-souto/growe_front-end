import type { Role } from "@/shared/model"

export interface SignInRequest {
  email: string
  password: string
}

export interface SignInResponse {
  id: string
  fullName: string
  email: string
  role: Role
  lastLoginAt: Date
  profileImage: string | null
}

export interface SignUpRequest {}
