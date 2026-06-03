import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'
import NotificationBell from '@/components/NotificationBell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  if (!token) redirect('/login')

  const session = verifyToken(token)
  if (!session) redirect('/login')

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={session.role} name={session.name} />
      <div className="flex-1 ml-60">
        <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-end gap-3 sticky top-0 z-40">
          <NotificationBell userId={session.userId} />
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
