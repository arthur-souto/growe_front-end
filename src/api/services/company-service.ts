import { instance } from "../instance"
import type {
  CompanyDetailsResponse,
  CreateCompanyRequest,
  CreateCompanyResponse,
  IdResponse,
  PageResponse,
  ResumeCompanyResponse,
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
}
