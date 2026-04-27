// types/auth.ts
export const ROLES = ["ADMIN", "USER", "MANAGER"] as const;
export type Role = typeof ROLES[number];

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
