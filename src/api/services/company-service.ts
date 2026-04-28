import { instance } from "../instance"
import type {
  CreateCompanyRequest,
  CreateCompanyResponse,
  PageResponse,
  ResumeCompanyResponse,
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
}
