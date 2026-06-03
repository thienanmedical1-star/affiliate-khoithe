'use client'
import { useState, useEffect } from 'react'

const ACTION_LABELS: Record<string, string> = {
  LOGIN: '🔐 Đăng nhập', CREATE_AFFILIATE: '👤 Tạo affiliate', UPDATE_AFFILIATE: '✏️ Sửa affiliate',
  CREATE_CUSTOMER: '🧑 Thêm khách', UPDATE_STATUS: '🔄 Cập nhật trạng thái', CREATE_ORDER: '📋 Tạo đơn',
  CONFIRM_PAYMENT: '💳 Xác nhận TT', PAY_COMMISSION: '💰 Chi trả HH', SYNC_SHEET: '🔄 Sync Sheet',
}

export default function HistoryPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/audit').then(r => r.json()).then(d => { setLogs(d); setLoading(false) })
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Lịch sử thao tác</h1>
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-gray-100">
              <th className="table-header text-left">Thời gian</th>
              <th className="table-header text-left">Thao tác</th>
              <th className="table-header text-left">Người thực hiện</th>
              <th className="table-header text-left">Đối tượng</th>
              <th className="table-header text-left">Chi tiết</th>
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={5} className="table-cell text-center text-gray-400 py-12">Đang tải...</td></tr>
                : logs.map(log => (
                <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="table-cell text-gray-400 text-xs whitespace-nowrap">{new Date(log.createdAt).toLocaleString('vi-VN')}</td>
                  <td className="table-cell"><span className="text-sm">{ACTION_LABELS[log.action] || log.action}</span></td>
                  <td className="table-cell text-gray-500">{log.user?.name || 'Hệ thống'}</td>
                  <td className="table-cell text-gray-500">{log.target || '—'}</td>
                  <td className="table-cell text-xs text-gray-400">
                    {log.oldValue && log.newValue ? `${log.oldValue} → ${log.newValue}` : log.newValue || log.note || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
