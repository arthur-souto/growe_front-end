import type { Role } from "@/shared/model"

export type CompanyMemberRole = "OWNER" | "RH" | "MANAGER" | "EMPLOYEE"

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

export interface SignUpRequest {
  fullName: string
  email: string
  password: string
  profileImage?: string
}

export type SizeRange = "ONE_TO_10" | "ELEVEN_TO_50" | "FIFTY_ONE_TO_200" | "TWO_HUNDRED_PLUS"
export type Plan = "FREE" | "STARTER" | "GROWTH" | "ENTERPRISE"

export interface CreateCompanyRequest {
  name: string
  cnpj: string
  sizeRange: SizeRange
  plan: Plan
  companyImage?: string
}

export interface CreateCompanyResponse {
  slug: string
  plan: Plan
  sizeRange: SizeRange
  trialEndsAt: string
  ownerEmail: string
  ownerName: string
  createdAt: string
}

export interface ResumeCompanyResponse {
  id: string
  name: string
  slug: string
  cnpj: string
  sizeRange: SizeRange
  plan: Plan
  companyImage: string | null
  isActive: boolean,
  users: Array<ResumeMemberResponse>
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
  empty: boolean
}


export interface ResumeMemberResponse {
  id: string
  fullName: string
  email: string
  profileImage: string
  role: CompanyMemberRole
  createdAt?: string
}

export interface CreateCompanyMemberRequest {
  fullName: string
  email: string
  password: string
  role: CompanyMemberRole
}

export interface UpdateCompanyMemberRequest {
  role: CompanyMemberRole
}

export interface CompanyDetailsResponse {
  id: string
  name: string
  slug: string
  cnpj: string
  sizeRange: SizeRange
  plan: Plan
  companyImage: string | null
  trialEndsAt: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  members: ResumeMemberResponse[]
}

export interface PageMemberResponse {
  content: ResumeMemberResponse[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
  empty: boolean
}

export interface UpdateCompanyRequest {
  name: string
  sizeRange?: SizeRange
  companyImage?: string
}

export interface IdResponse {
  id: string
}

export interface ImportSummaryResponse {
  created: number
  skipped: number
  erros: string[]
}