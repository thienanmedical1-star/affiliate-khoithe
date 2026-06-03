'use client'
import { useState, useEffect } from 'react'

function fmt(n: number) { return n.toLocaleString('vi-VN') + 'đ' }

export default function CommissionPage() {
  const [affiliates, setAffiliates] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [role, setRole] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [form, setForm] = useState({ affiliateId: '', amount: '', note: '' })

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setRole(d.role))
    fetch('/api/commission').then(r => r.json()).then(setPayments)
    fetch('/api/orders').then(r => r.json()).then(setOrders)
    fetch('/api/affiliates').then(r => r.json()).then(setAffiliates).catch(() => {})
  }, [])

  const pay = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/commission', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (res.ok) {
      const d = await res.json()
      setPayments(p => [d, ...p])
      setShowForm(false)
      setForm({ affiliateId: '', amount: '', note: '' })
    }
  }

  const deletePayment = async (id: string) => {
    if (!confirm('Xóa lịch sử chi trả này? Hoa hồng sẽ được hoàn lại.')) return
    const res = await fetch(`/api/commission/${id}`, { method: 'DELETE' })
    if (res.ok) setPayments(p => p.filter(x => x.id !== id))
    else alert('Lỗi khi xóa')
  }

  const paidOrders = orders.filter(o => o.paymentStatus === 'PAID')

  const summaryByAffiliate = affiliates.map(a => {
    const aOrders = paidOrders.filter(o => o.affiliateId === a.id)
    const aPaid = payments.filter(p => p.affiliateId === a.id)
    const totalComm = aOrders.reduce((s, o) => s + o.commission, 0)
    const totalPd = aPaid.reduce((s, p) => s + p.amount, 0)
    return { ...a, totalCommission: totalComm, totalPaid: totalPd, remaining: totalComm - totalPd }
  })

  if (role === 'AFFILIATE') {
    const totalCommission = paidOrders.reduce((s, o) => s + o.commission, 0)
    const totalPaid = payments.reduce((s, p) => s + p.amount, 0)
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Hoa hồng của tôi</h1>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card bg-orange-50 border-0"><p className="text-xs text-orange-600 mb-1">Hoa hồng phát sinh</p><p className="text-2xl font-bold text-orange-700">{fmt(totalCommission)}</p></div>
          <div className="card bg-green-50 border-0"><p className="text-xs text-green-600 mb-1">Đã được trả</p><p className="text-2xl font-bold text-green-700">{fmt(totalPaid)}</p></div>
          <div className="card bg-red-50 border-0"><p className="text-xs text-red-600 mb-1">Còn lại</p><p className="text-2xl font-bold text-red-700">{fmt(totalCommission - totalPaid)}</p></div>
        </div>
        <div className="card">
          <h2 className="font-semibold mb-3">Lịch sử nhận hoa hồng</h2>
          {payments.length === 0 ? <p className="text-gray-400 text-sm">Chưa có lịch sử</p> : payments.map(p => (
            <div key={p.id} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
              <div><p className="text-sm font-medium text-gray-800">{fmt(p.amount)}</p><p className="text-xs text-gray-400">{p.note}</p></div>
              <p className="text-xs text-gray-400">{new Date(p.paidAt).toLocaleDateString('vi-VN')}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Hoa hồng</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowHistory(true)} className="btn-secondary text-sm">📋 Lịch sử chi trả</button>
          <button onClick={() => setShowForm(true)} className="btn-primary">+ Chi trả hoa hồng</button>
        </div>
      </div>

      {/* Tổng hợp theo affiliate */}
      <div className="card p-0 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Tổng hợp hoa hồng</h2>
        </div>
        <table className="w-full">
          <thead><tr className="border-b border-gray-100">
            <th className="table-header text-left">Affiliate</th>
            <th className="table-header text-right">Hoa hồng phát sinh</th>
            <th className="table-header text-right">Đã trả</th>
            <th className="table-header text-right">Còn lại</th>
          </tr></thead>
          <tbody>{summaryByAffiliate.map(a => (
            <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="table-cell">
                <p className="font-medium">{a.name}</p>
                <p className="text-xs text-gray-400">{a.affiliateCode} · {a.commission}% hoa hồng</p>
              </td>
              <td className="table-cell text-right">{fmt(a.totalCommission)}</td>
              <td className="table-cell text-right text-green-600">{fmt(a.totalPaid)}</td>
              <td className={`table-cell text-right font-semibold ${a.remaining < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                {a.remaining < 0 ? '⚠️ ' : ''}{fmt(a.remaining)}
                {a.remaining < 0 && <p className="text-xs font-normal text-red-400">Chi trả vượt quá hoa hồng</p>}
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      {/* Form chi trả */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Chi trả hoa hồng</h2>
            <form onSubmit={pay} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Affiliate</label>
                <select className="input" value={form.affiliateId} onChange={e => setForm(f => ({ ...f, affiliateId: e.target.value }))} required>
                  <option value="">Chọn affiliate</option>
                  {summaryByAffiliate.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} — còn lại: {fmt(Math.max(a.remaining, 0))}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền (VNĐ)</label>
                <input className="input" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <input className="input" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="VD: Chuyển khoản tháng 6" />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">Xác nhận</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lịch sử chi trả */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold">Lịch sử chi trả hoa hồng</h2>
              <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {payments.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Chưa có lịch sử</p>
              ) : payments.map(p => (
                <div key={p.id} className="flex items-center justify-between px-6 py-3 border-b border-gray-50 hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{fmt(p.amount)}</p>
                    <p className="text-xs text-gray-500">{p.affiliate?.name} · {p.note || 'Không có ghi chú'}</p>
                    <p className="text-xs text-gray-400">{new Date(p.paidAt).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <button
                    onClick={() => deletePayment(p.id)}
                    className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg font-medium transition-colors"
                  >
                    🗑 Xóa
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
