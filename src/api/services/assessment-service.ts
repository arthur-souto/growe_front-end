import { instance } from "../instance"
import type {
  IdResponse,
  ImproveCommentRequest,
  ImproveCommentResponse,
  PagedModelAssessmentResponse,
  SubmitAssessmentRequest,
} from "../model"

const BASE = "/assessments"

export class AssessmentService {
  findAllByCycle(cycleId: string, page = 0, size = 10) {
    return instance.get<PagedModelAssessmentResponse>(`${BASE}/cycle/${cycleId}`, {
      params: { page, size },
    })
  }

  findAllByEvaluated(evaluatedId: string, page = 0, size = 10) {
    return instance.get<PagedModelAssessmentResponse>(`${BASE}/evaluated/${evaluatedId}`, {
      params: { page, size },
    })
  }

  findAllByEvaluator(evaluatorId: string, page = 0, size = 10) {
    return instance.get<PagedModelAssessmentResponse>(`${BASE}/evaluator/${evaluatorId}`, {
      params: { page, size },
    })
  }

  submitAssessment(taskId: string, payload: SubmitAssessmentRequest) {
    return instance.post<IdResponse>(`${BASE}/submit/${taskId}`, payload)
  }

  improveComment(payload: ImproveCommentRequest) {
    return instance.post<ImproveCommentResponse>(`${BASE}/improve/comment`, payload)
  }
}
