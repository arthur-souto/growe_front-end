import { instance } from "../instance"
import type { SignInRequest, SignInResponse, SignUpRequest } from "../model"


const BASE = '/auth'

export class AuthService {

    public async signIn (payload: SignInRequest)  {
      return instance.post<SignInResponse>(`${BASE}/sign-in`, payload)
    }

    public async signUp  (payload: SignUpRequest)  {
      return instance.post(`${BASE}/sign-up`, payload)
    }

    public async logout() {
      return instance.post(`${BASE}/logout`)
    }
}

