'use client'
import { useState, useEffect } from 'react'

function fmt(n: number) { return n.toLocaleString('vi-VN') + 'đ' }

export default function PackagesPage() {
  const [packages, setPackages] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [form, setForm] = useState({ name: '', price: '' })

  useEffect(() => { fetch('/api/packages').then(r => r.json()).then(setPackages) }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editItem) {
      const res = await fetch(`/api/packages/${editItem.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) { const d = await res.json(); setPackages(p => p.map(pkg => pkg.id === editItem.id ? d : pkg)) }
    } else {
      const res = await fetch('/api/packages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) { const d = await res.json(); setPackages(p => [...p, d]) }
    }
    setShowForm(false); setEditItem(null); setForm({ name: '', price: '' })
  }

  const toggle = async (id: string, isActive: boolean) => {
    await fetch(`/api/packages/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !isActive }) })
    setPackages(p => p.map(pkg => pkg.id === id ? { ...pkg, isActive: !isActive } : pkg))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gói giá</h1>
        <button onClick={() => { setEditItem(null); setForm({ name: '', price: '' }); setShowForm(true) }} className="btn-primary">+ Thêm gói</button>
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-semibold mb-4">{editItem ? 'Sửa gói' : 'Thêm gói giá'}</h2>
            <form onSubmit={save} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Tên gói</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Giá (VNĐ)</label><input className="input" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required /></div>
              <div className="flex gap-3"><button type="submit" className="btn-primary flex-1">Lưu</button><button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Hủy</button></div>
            </form>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {packages.map(p => (
          <div key={p.id} className={`card ${!p.isActive ? 'opacity-50' : ''}`}>
            <h3 className="font-semibold text-gray-800 mb-1">{p.name}</h3>
            <p className="text-2xl font-bold text-blue-600 mb-4">{fmt(p.price)}</p>
            <div className="flex gap-2">
              <button onClick={() => { setEditItem(p); setForm({ name: p.name, price: String(p.price) }); setShowForm(true) }} className="btn-secondary flex-1 text-xs">Sửa</button>
              <button onClick={() => toggle(p.id, p.isActive)} className={`flex-1 text-xs px-3 py-2 rounded-lg font-medium transition-colors ${p.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                {p.isActive ? 'Ẩn' : 'Hiện'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
