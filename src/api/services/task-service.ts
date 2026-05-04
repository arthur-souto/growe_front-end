import { instance } from "../instance"
import type {
  CreateEvaluationTaskRequest,
  IdResponse,
  PagedModelEvaluationTaskResponse,
} from "../model"

const BASE = "/tasks"

export class TaskService {
  getTasks(cycleId: string, page = 0, size = 100) {
    return instance.get<PagedModelEvaluationTaskResponse>(`${BASE}/${cycleId}`, {
      params: { page, size },
    })
  }

  createTask(slug: string, cycleId: string, payload: CreateEvaluationTaskRequest) {
    return instance.post<IdResponse>(`${BASE}/create-task/${slug}/cycle/${cycleId}`, payload)
  }
}
