'use client'
import { useState, useEffect } from 'react'

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  NEW: { label: 'Mới đăng ký', cls: 'badge-new' },
  CONSULTING: { label: 'Đang tư vấn', cls: 'badge-consulting' },
  CLOSED: { label: 'Đã chốt', cls: 'badge-closed' },
  REJECTED: { label: 'Không mua', cls: 'badge-rejected' },
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [role, setRole] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setRole(d.role))
    fetch('/api/customers').then(r => r.json()).then(d => { setCustomers(d); setLoading(false) })
  }, [])

  const filtered = customers.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
    const matchFilter = filter === 'ALL' || c.status === filter
    return matchSearch && matchFilter
  })

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/customers/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, status } : c))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Khách hàng</h1>
        <span className="text-sm text-gray-400">{filtered.length} khách</span>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <input className="input max-w-xs" placeholder="Tìm theo tên, SĐT..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="input max-w-[180px]" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="ALL">Tất cả trạng thái</option>
          {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-gray-100">
              <th className="table-header text-left">Khách hàng</th>
              <th className="table-header text-left">Affiliate</th>
              <th className="table-header text-left">Ngày đăng ký</th>
              <th className="table-header text-center">Trạng thái</th>
              {role === 'ADMIN' && <th className="table-header text-center">Cập nhật</th>}
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="table-cell text-center text-gray-400 py-12">Đang tải...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="table-cell text-center text-gray-400 py-12">Không có khách hàng</td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="table-cell">
                    <p className="font-medium text-gray-800">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.phone} {c.email && `· ${c.email}`}</p>
                  </td>
                  <td className="table-cell">
                    <span className="text-sm">{c.affiliate?.name}</span>
                    <span className="text-xs text-gray-400 ml-1">({c.affiliate?.affiliateCode})</span>
                  </td>
                  <td className="table-cell text-gray-500">{new Date(c.registeredAt).toLocaleDateString('vi-VN')}</td>
                  <td className="table-cell text-center">
                    <span className={STATUS_MAP[c.status]?.cls}>{STATUS_MAP[c.status]?.label}</span>
                  </td>
                  {role === 'ADMIN' && (
                    <td className="table-cell text-center">
                      <select
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={c.status}
                        onChange={e => updateStatus(c.id, e.target.value)}
                      >
                        {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
