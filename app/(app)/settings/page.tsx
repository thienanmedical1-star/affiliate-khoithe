'use client'
import { useState } from 'react'

export default function SettingsPage() {
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [token, setToken] = useState('')
  const [step, setStep] = useState<'idle' | 'scan' | 'done'>('idle')
  const [msg, setMsg] = useState('')

  const setup2FA = async () => {
    const res = await fetch('/api/auth/2fa/setup', { method: 'POST' })
    const d = await res.json()
    setQrCode(d.qrCode)
    setSecret(d.secret)
    setStep('scan')
  }

  const verify2FA = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/auth/2fa/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) })
    if (res.ok) { setStep('done'); setMsg('✅ Bật 2FA thành công!') }
    else { setMsg('❌ Mã không đúng, thử lại') }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Cài đặt</h1>
      <div className="card max-w-md">
        <h2 className="text-base font-semibold text-gray-800 mb-1">Xác thực 2 lớp (2FA)</h2>
        <p className="text-sm text-gray-500 mb-4">Tăng bảo mật bằng Google Authenticator</p>

        {step === 'idle' && (
          <button onClick={setup2FA} className="btn-primary">Bật 2FA</button>
        )}

        {step === 'scan' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">1. Mở Google Authenticator → Thêm tài khoản → Quét QR</p>
            <img src={qrCode} alt="QR Code" className="w-48 h-48 border rounded-lg" />
            <p className="text-xs text-gray-400">Hoặc nhập mã thủ công: <code className="bg-gray-100 px-1 rounded">{secret}</code></p>
            <p className="text-sm text-gray-600">2. Nhập mã 6 số từ app để xác nhận:</p>
            <form onSubmit={verify2FA} className="flex gap-2">
              <input className="input text-center tracking-widest text-lg" maxLength={6} value={token} onChange={e => setToken(e.target.value)} placeholder="000000" />
              <button type="submit" className="btn-primary px-6">Xác nhận</button>
            </form>
            {msg && <p className="text-sm">{msg}</p>}
          </div>
        )}

        {step === 'done' && <p className="text-green-600 font-medium">✅ 2FA đã được bật</p>}
      </div>
    </div>
  )
}
