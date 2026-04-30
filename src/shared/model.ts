// types/auth.ts
export const ROLES = ["ADMIN", "USER", "MANAGER"] as const
export const COMPANY_ROLES = ["OWNER", "RH", "MANAGER", "EMPLOYEE"] as const
export type CompanyRole = (typeof COMPANY_ROLES)[number]
export type Role = (typeof ROLES)[number]

export interface User {
  fullName: string
  email: string
  role: Role
  active: boolean
  profileImage: string | null
  lastLoginAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface InfoHeaderUser {
  id: string
  fullName: string
  email: string
  role: Role
  lastLoginAt: Date
  profileImage: string | null
}
