'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

interface Props {
  role: string
  name: string
}

export default function Sidebar({ role, name }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  const adminLinks = [
    { href: '/dashboard', label: 'Tổng quan', icon: '📊' },
    { href: '/affiliates', label: 'Affiliate', icon: '👥' },
    { href: '/customers', label: 'Khách hàng', icon: '🧑' },
    { href: '/orders', label: 'Đơn hàng', icon: '📋' },
    { href: '/packages', label: 'Gói giá', icon: '💼' },
    { href: '/commission', label: 'Hoa hồng', icon: '💰' },
    { href: '/history', label: 'Lịch sử', icon: '📜' },
    { href: '/settings', label: 'Cài đặt', icon: '⚙️' },
  ]

  const affiliateLinks = [
    { href: '/dashboard', label: 'Tổng quan', icon: '📊' },
    { href: '/customers', label: 'Khách hàng', icon: '🧑' },
    { href: '/orders', label: 'Đơn hàng', icon: '📋' },
    { href: '/commission', label: 'Hoa hồng', icon: '💰' },
    { href: '/history', label: 'Lịch sử', icon: '📜' },
    { href: '/settings', label: 'Cài đặt', icon: '⚙️' },
  ]

  const links = role === 'ADMIN' ? adminLinks : affiliateLinks

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div className="w-60 min-h-screen bg-white border-r border-gray-100 flex flex-col fixed left-0 top-0 bottom-0">
      <div className="p-5 border-b border-gray-100">
        <h1 className="text-lg font-bold text-blue-600">KhoiThe Affiliate</h1>
        <p className="text-xs text-gray-400 mt-0.5">{role === 'ADMIN' ? '👑 Quản trị viên' : '🔗 Affiliate'}</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`sidebar-link ${pathname === link.href ? 'active' : 'text-gray-600'}`}
          >
            <span>{link.icon}</span>
            <span>{link.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <p className="text-sm font-medium text-gray-700 mb-2 truncate">{name}</p>
        <button onClick={logout} className="w-full text-left text-sm text-red-500 hover:text-red-700 transition-colors">
          Đăng xuất
        </button>
      </div>
    </div>
  )
}
