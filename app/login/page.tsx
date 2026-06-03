'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ username: '', password: '', totpCode: '' })
  const [step, setStep] = useState<'credentials' | 'totp'>('credentials')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.requiresTOTP) { setStep('totp'); setLoading(false); return }
      if (!res.ok) { setError(data.error); setLoading(false); return }
      router.push('/dashboard')
    } catch {
      setError('Lỗi kết nối')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔗</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">KhoiThe Affiliate</h1>
          <p className="text-gray-500 text-sm mt-1">Đăng nhập để tiếp tục</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 'credentials' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập</label>
                <input className="input" type="text" value={form.username}
                  onChange={e => setForm(p => ({ ...p, username: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                <input className="input" type="password" value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã xác thực 2FA (6 số)</label>
              <input className="input text-center text-2xl tracking-widest" type="text"
                maxLength={6} value={form.totpCode} placeholder="000000"
                onChange={e => setForm(p => ({ ...p, totpCode: e.target.value }))} required autoFocus />
              <p className="text-xs text-gray-400 mt-2 text-center">Mở Google Authenticator để lấy mã</p>
            </div>
          )}

          {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
            {loading ? 'Đang xử lý...' : step === 'totp' ? 'Xác nhận' : 'Đăng nhập'}
          </button>
          {step === 'totp' && (
            <button type="button" onClick={() => setStep('credentials')} className="btn-secondary w-full">
              Quay lại
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
