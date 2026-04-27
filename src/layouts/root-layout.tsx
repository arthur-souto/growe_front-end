
import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router'
import { navigationService } from '@/api/services/navigation-service'

export default function RootLayout() {
    const navigate = useNavigate()

    useEffect(() => {
        navigationService.setNavigator(navigate)
    }, [navigate])



    return <Outlet />
}