import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminDashboard from './AdminDashboard'
import AffiliateDashboard from './AffiliateDashboard'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  if (!token) redirect('/login')
  const session = verifyToken(token)
  if (!session) redirect('/login')

  if (session.role === 'ADMIN') {
    return <AdminDashboard session={session} />
  }
  return <AffiliateDashboard session={session} />
}
