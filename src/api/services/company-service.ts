import { instance } from "../instance"
import type {
  CompanyDetailsResponse,
  CreateCompanyMemberRequest,
  CreateCompanyRequest,
  CreateCompanyResponse,
  IdResponse,
  ImportSummaryResponse,
  PageMemberResponse,
  PageResponse,
  ResumeMemberResponse,
  ResumeCompanyResponse,
  UpdateCompanyMemberRequest,
  UpdateCompanyRequest,
} from "../model"

const BASE = "/companies"

export class CompanyService {
  getMyCompanies(page = 0, size = 10) {
    return instance.get<PageResponse<ResumeCompanyResponse>>(`${BASE}/my-companies`, {
      params: { page, size },
    })
  }

  createCompany(payload: CreateCompanyRequest) {
    return instance.post<CreateCompanyResponse>(`${BASE}/create-company`, payload)
  }

  getCompany(slug: string) {
    return instance.get<CompanyDetailsResponse>(`${BASE}/${slug}`)
  }

  updateCompany(slug: string, payload: UpdateCompanyRequest) {
    return instance.put<IdResponse>(`${BASE}/${slug}`, payload)
  }

  deleteCompany(slug: string) {
    return instance.delete(`${BASE}/${slug}`)
  }

  getMembers(slug: string, page = 0, size = 200) {
    return instance.get<PageMemberResponse>(`${BASE}/${slug}/members`, {
      params: { page, size },
    })
  }

  addMember(slug: string, req: CreateCompanyMemberRequest) {
    return instance.post<IdResponse>(`${BASE}/${slug}/add-member`, null, {
      params: req,
    })
  }

  updateMember(slug: string, memberId: string, payload: UpdateCompanyMemberRequest) {
    return instance.patch<IdResponse>(`${BASE}/${slug}/update-member/${memberId}`, payload)
  }

  removeMember(slug: string, memberId: string) {
    return instance.delete(`${BASE}/${slug}/members/${memberId}`)
  }

  importMembers(slug: string, file: File) {
    const form = new FormData()
    form.append("file", file)
    return instance.post<ImportSummaryResponse>(`${BASE}/${slug}/members/import`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  }
}
