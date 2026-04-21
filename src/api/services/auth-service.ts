import { instance } from "../instance"
import type { SignInRequest, SignInResponse } from "../model"


const BASE = '/auth'

export const authService = {
    signIn: async (payload: SignInRequest) => {
      return instance.post<SignInResponse>(`${BASE}/sign-in`, payload)
    },
}