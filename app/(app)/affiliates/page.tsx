'use client'
import { useState, useEffect } from 'react'

function fmt(n: number) { return n.toLocaleString('vi-VN') + 'đ' }

export default function AffiliatesPage() {
  const [affiliates, setAffiliates] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ username: '', password: '', name: '', email: '', affiliateCode: '', commission: '' })

  useEffect(() => {
    fetch('/api/affiliates').then(r => r.json()).then(d => { setAffiliates(d); setLoading(false) })
  }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editItem) {
      const res = await fetch(`/api/affiliates/${editItem.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) { const d = await res.json(); setAffiliates(p => p.map(a => a.id === editItem.id ? { ...a, ...d } : a)) }
    } else {
      const res = await fetch('/api/affiliates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) { const d = await res.json(); setAffiliates(p => [d, ...p]) }
    }
    setShowForm(false); setEditItem(null)
    setForm({ username: '', password: '', name: '', email: '', affiliateCode: '', commission: '' })
  }

  const openEdit = (a: any) => {
    setEditItem(a)
    setForm({ username: a.username, password: '', name: a.name, email: a.email || '', affiliateCode: a.affiliateCode || '', commission: String(a.commission) })
    setShowForm(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Affiliate</h1>
        <button onClick={() => { setEditItem(null); setForm({ username: '', password: '', name: '', email: '', affiliateCode: '', commission: '' }); setShowForm(true) }} className="btn-primary">+ Thêm Affiliate</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold mb-4">{editItem ? 'Sửa Affiliate' : 'Thêm Affiliate mới'}</h2>
            <form onSubmit={save} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Username</label><input className="input" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required disabled={!!editItem} /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu {editItem && <span className="text-gray-400">(để trống = không đổi)</span>}</label><input className="input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required={!editItem} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Mã affiliate</label><input className="input" value={form.affiliateCode} onChange={e => setForm(f => ({ ...f, affiliateCode: e.target.value }))} placeholder="AFF001" required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Hoa hồng (%)</label><input className="input" type="number" min="0" max="100" value={form.commission} onChange={e => setForm(f => ({ ...f, commission: e.target.value }))} required /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">Lưu</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? <p className="text-gray-400">Đang tải...</p> : affiliates.map(a => (
          <div key={a.id} className="card">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-800">{a.name}</h3>
                <p className="text-xs text-gray-400">@{a.username} · {a.affiliateCode}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${a.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {a.isActive ? 'Hoạt động' : 'Tạm dừng'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-gray-50 rounded-lg p-2 text-center"><p className="text-xs text-gray-400">Hoa hồng</p><p className="font-bold text-blue-600">{a.commission}%</p></div>
              <div className="bg-gray-50 rounded-lg p-2 text-center"><p className="text-xs text-gray-400">Khách</p><p className="font-bold text-gray-700">{a._count?.customers || 0}</p></div>
            </div>
            <button onClick={() => openEdit(a)} className="btn-secondary w-full text-xs">Chỉnh sửa</button>
          </div>
        ))}
      </div>
    </div>
  )
}
