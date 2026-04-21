import axios from 'axios'

export const instance = axios.create({
    baseURL: 'http://localhost:8080/api/v1',
    timeout: 1000,
    headers: {'Content-Type': 'application/json'}
})

// basic interceptor 
instance.interceptors.request.use(
    (req) => {

        const token = localStorage.getItem('token')

        if (token) {
            req.headers['Authorization'] = `Bearer ${token}`
        }

        return req
    },
    (err) => {
        return Promise.reject(err)
    }
)

// // also handle response errors globally
// instance.interceptors.response.use(
//     (res) => res,
//     (error) => {
//         if (error.response?.status === 401) {
//             localStorage.removeItem('token')
//             window.location.href = '/sign-in' // redirect if token expired
//         }

//         return Promise.reject(error)
//     }
// )


