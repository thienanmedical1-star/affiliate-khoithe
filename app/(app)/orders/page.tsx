'use client'
import { useState, useEffect } from 'react'

function fmt(n: number) { return n.toLocaleString('vi-VN') + 'đ' }

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [packages, setPackages] = useState<any[]>([])
  const [role, setRole] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ customerId: '', packageId: '', price: '', customPrice: false, customPriceNote: '' })
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setRole(d.role))
    Promise.all([
      fetch('/api/orders').then(r => r.json()),
      fetch('/api/customers').then(r => r.json()),
      fetch('/api/packages').then(r => r.json()),
    ]).then(([o, c, p]) => { setOrders(o); setCustomers(c); setPackages(p); setLoading(false) })
  }, [])

  const selectPackage = (pkgId: string) => {
    const pkg = packages.find((p: any) => p.id === pkgId)
    setForm(f => ({ ...f, packageId: pkgId, price: pkg ? String(pkg.price) : f.price }))
  }

  const createOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (res.ok) {
      const order = await res.json()
      setOrders(prev => [order, ...prev])
      setShowForm(false)
      setForm({ customerId: '', packageId: '', price: '', customPrice: false, customPriceNote: '' })
    }
  }

  const confirmPayment = async (id: string) => {
    if (!confirm('Xác nhận khách đã thanh toán?')) return
    const res = await fetch(`/api/orders/${id}/confirm`, { method: 'POST' })
    if (res.ok) {
      const updated = await res.json()
      setOrders(prev => prev.map(o => o.id === id ? updated : o))
    }
  }

  const filtered = orders.filter(o => filter === 'ALL' || o.paymentStatus === filter)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Đơn hàng</h1>
        {role === 'ADMIN' && (
          <button onClick={() => setShowForm(true)} className="btn-primary">+ Tạo đơn hàng</button>
        )}
      </div>

      <div className="flex gap-3 mb-4">
        <select className="input max-w-[180px]" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="ALL">Tất cả</option>
          <option value="UNPAID">Chưa thanh toán</option>
          <option value="PAID">Đã thanh toán</option>
        </select>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Tạo đơn hàng</h2>
            <form onSubmit={createOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Khách hàng</label>
                <select className="input" value={form.customerId} onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))} required>
                  <option value="">Chọn khách hàng</option>
                  {customers.map((c: any) => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gói giá</label>
                <select className="input" value={form.packageId} onChange={e => selectPackage(e.target.value)}>
                  <option value="">Chọn gói (hoặc nhập giá tùy chỉnh)</option>
                  {packages.filter((p: any) => p.isActive).map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name} - {fmt(p.price)}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="custom" checked={form.customPrice} onChange={e => setForm(f => ({ ...f, customPrice: e.target.checked }))} />
                <label htmlFor="custom" className="text-sm text-gray-700">Dùng giá tùy chỉnh</label>
              </div>
              {(form.customPrice || !form.packageId) && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giá bán</label>
                    <input className="input" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="VD: 10000000" required />
                  </div>
                  {form.customPrice && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Lý do chỉnh giá <span className="text-red-500">*</span></label>
                      <input className="input" value={form.customPriceNote} onChange={e => setForm(f => ({ ...f, customPriceNote: e.target.value }))} required={form.customPrice} placeholder="VD: Khách được giảm giá..." />
                    </div>
                  )}
                </>
              )}
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">Lưu đơn</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-gray-100">
              <th className="table-header text-left">Khách hàng</th>
              <th className="table-header text-left">Affiliate</th>
              <th className="table-header text-left">Gói</th>
              <th className="table-header text-right">Giá bán</th>
              <th className="table-header text-right">Hoa hồng</th>
              <th className="table-header text-center">Thanh toán</th>
              {role === 'ADMIN' && <th className="table-header text-center">Thao tác</th>}
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="table-cell text-center text-gray-400 py-12">Đang tải...</td></tr>
              ) : filtered.map(o => (
                <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="table-cell">
                    <p className="font-medium">{o.customer?.name}</p>
                    <p className="text-xs text-gray-400">{o.customer?.phone}</p>
                  </td>
                  <td className="table-cell text-gray-500">{o.affiliate?.name}</td>
                  <td className="table-cell">
                    <span className="text-sm">{o.package?.name || 'Tùy chỉnh'}</span>
                    {o.customPrice && <span className="ml-1 text-xs text-orange-500">✏️</span>}
                  </td>
                  <td className="table-cell text-right font-medium">{fmt(o.price)}</td>
                  <td className="table-cell text-right text-green-600">{o.paymentStatus === 'PAID' ? fmt(o.commission) : '—'}</td>
                  <td className="table-cell text-center">
                    <span className={o.paymentStatus === 'PAID' ? 'badge-paid' : 'badge-unpaid'}>
                      {o.paymentStatus === 'PAID' ? 'Đã TT' : 'Chưa TT'}
                    </span>
                  </td>
                  {role === 'ADMIN' && (
                    <td className="table-cell text-center">
                      {o.paymentStatus === 'UNPAID' && (
                        <button onClick={() => confirmPayment(o.id)} className="btn-success text-xs px-3 py-1">✓ Xác nhận TT</button>
                      )}
                      {o.paymentStatus === 'PAID' && (
                        <span className="text-xs text-gray-400">{o.paidAt ? new Date(o.paidAt).toLocaleDateString('vi-VN') : ''}</span>
                      )}
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
