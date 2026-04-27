import axios, { AxiosError } from 'axios'

const TIMEOUT = 10000
const UNAUTHORIZED_STATUS = 401
const ME_ENDPOINT = "/users/me"

export const instance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: TIMEOUT,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
})

instance.interceptors.request.use(
    (req) => req,
    (err) => Promise.reject(err)
)

instance.interceptors.response.use(
    (res) => res,
    async (err: AxiosError) => {
        const url = err.config?.url ?? ""
        const isUnauthorized = err.response?.status === UNAUTHORIZED_STATUS
        const isMeEndpoint = url.includes(ME_ENDPOINT)

        if (isUnauthorized && !isMeEndpoint) {
            window.location.href = '/sign-in'
        }

        return Promise.reject(err)
    }
)