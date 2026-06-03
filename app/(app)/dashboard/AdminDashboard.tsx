'use client'
import { useEffect, useState } from 'react'

function fmt(n: number) { return n.toLocaleString('vi-VN') + 'đ' }

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#84cc16']

function BarChart({ data, valueKey, labelKey, color = '#3b82f6', prefix = '', suffix = '' }: any) {
  const max = Math.max(...data.map((d: any) => d[valueKey]), 1)
  return (
    <div className="space-y-2">
      {data.map((d: any, i: number) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-gray-500 w-20 truncate shrink-0">{d[labelKey]}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
            <div
              className="h-full rounded-full flex items-center px-2 transition-all duration-700"
              style={{ width: `${Math.max((d[valueKey] / max) * 100, 2)}%`, background: color }}
            >
              <span className="text-xs text-white font-medium whitespace-nowrap">
                {prefix}{typeof d[valueKey] === 'number' && d[valueKey] > 999 ? fmt(d[valueKey]) : d[valueKey]}{suffix}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function LineChart({ data, months }: { data: any[], months: string[] }) {
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1)
  const w = 500, h = 160, pad = 40
  const points = data.map((d, i) => ({
    x: pad + (i / (data.length - 1 || 1)) * (w - pad * 2),
    y: h - pad - (d.revenue / maxRevenue) * (h - pad * 2),
    revenue: d.revenue,
    month: d.month,
  }))
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const area = `${path} L ${points[points.length-1]?.x} ${h - pad} L ${points[0]?.x} ${h - pad} Z`

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ minWidth: 300 }}>
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
          <g key={i}>
            <line x1={pad} y1={h - pad - t * (h - pad * 2)} x2={w - pad} y2={h - pad - t * (h - pad * 2)} stroke="#f3f4f6" strokeWidth="1" />
            <text x={pad - 4} y={h - pad - t * (h - pad * 2) + 4} textAnchor="end" fontSize="9" fill="#9ca3af">
              {t === 0 ? '0' : fmt(maxRevenue * t).replace('đ', '')}
            </text>
          </g>
        ))}
        <path d={area} fill="#3b82f6" fillOpacity="0.08" />
        <path d={path} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="#3b82f6" />
            <text x={p.x} y={h - pad + 14} textAnchor="middle" fontSize="9" fill="#6b7280">{p.month}</text>
          </g>
        ))}
      </svg>
    </div>
  )
}

function MultiBarChart({ affiliateStats, months }: any) {
  const max = Math.max(...affiliateStats.flatMap((a: any) => a.monthlyCustomers.map((m: any) => m.count)), 1)
  const barW = 18
  const gap = 4
  const groupW = affiliateStats.length * (barW + gap)
  const chartW = months.length * (groupW + 20) + 60
  const h = 140, padY = 20, padX = 40

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${chartW} ${h}`} style={{ minWidth: 300, width: '100%' }}>
        {[0, 0.5, 1].map((t, i) => (
          <g key={i}>
            <line x1={padX} y1={padY + (1 - t) * (h - padY * 2)} x2={chartW - 10} y2={padY + (1 - t) * (h - padY * 2)} stroke="#f3f4f6" strokeWidth="1" />
            <text x={padX - 4} y={padY + (1 - t) * (h - padY * 2) + 4} textAnchor="end" fontSize="8" fill="#9ca3af">{Math.round(max * t)}</text>
          </g>
        ))}
        {months.map((month: string, mi: number) => {
          const gx = padX + mi * (groupW + 20)
          return (
            <g key={mi}>
              {affiliateStats.map((a: any, ai: number) => {
                const val = a.monthlyCustomers[mi]?.count || 0
                const bh = (val / max) * (h - padY * 2)
                const bx = gx + ai * (barW + gap)
                return (
                  <g key={ai}>
                    <rect x={bx} y={h - padY - bh} width={barW} height={bh} fill={COLORS[ai % COLORS.length]} rx="2" fillOpacity="0.85" />
                    {val > 0 && <text x={bx + barW / 2} y={h - padY - bh - 3} textAnchor="middle" fontSize="8" fill={COLORS[ai % COLORS.length]}>{val}</text>}
                  </g>
                )
              })}
              <text x={gx + groupW / 2} y={h - 4} textAnchor="middle" fontSize="9" fill="#6b7280">{month}</text>
            </g>
          )
        })}
      </svg>
      <div className="flex flex-wrap gap-3 mt-2">
        {affiliateStats.map((a: any, i: number) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="text-xs text-gray-600">{a.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminDashboard({ session }: { session: any }) {
  const [stats, setStats] = useState<any>(null)
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/stats').then(r => r.json()),
      fetch('/api/dashboard').then(r => r.json()),
    ]).then(([s, d]) => { setStats(s); setSummary(d); setLoading(false) })
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-gray-400 text-sm">Đang tải dữ liệu...</p>
      </div>
    </div>
  )

  const { affiliateStats = [], monthlyRevenue = [], months = [] } = stats || {}

  const topByCustomers = [...affiliateStats].sort((a, b) => b.totalCustomers - a.totalCustomers)
  const topByRevenue = [...affiliateStats].sort((a, b) => b.totalRevenue - a.totalRevenue)
  const topByCommission = [...affiliateStats].sort((a, b) => b.totalCommission - a.totalCommission)

  const summaryCards = [
    { label: 'Tổng khách', value: summary?.totalCustomers || 0, color: 'bg-blue-50 text-blue-700' },
    { label: 'Đã thanh toán', value: (summary?.paidOrders || 0) + ' đơn', color: 'bg-green-50 text-green-700' },
    { label: 'Chưa thanh toán', value: (summary?.unpaidOrders || 0) + ' đơn', color: 'bg-yellow-50 text-yellow-700' },
    { label: 'Tổng doanh thu', value: fmt(summary?.totalRevenue || 0), color: 'bg-purple-50 text-purple-700' },
    { label: 'Hoa hồng phát sinh', value: fmt(summary?.totalCommission || 0), color: 'bg-orange-50 text-orange-700' },
    { label: 'Hoa hồng còn lại', value: fmt((summary?.totalCommission || 0) - (summary?.totalPaid || 0)), color: 'bg-red-50 text-red-700' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Tổng quan hệ thống 📊</h1>
      <p className="text-gray-500 text-sm mb-6">Xin chào, {session.name}</p>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {summaryCards.map((s, i) => (
          <div key={i} className={`card ${s.color} border-0`}>
            <p className="text-xs font-medium opacity-70 mb-1">{s.label}</p>
            <p className="text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">📈 Doanh thu theo tháng</h2>
          {monthlyRevenue.length > 0 ? <LineChart data={monthlyRevenue} months={months} /> : <p className="text-gray-400 text-sm text-center py-8">Chưa có dữ liệu</p>}
        </div>
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">👥 Khách mới theo tháng</h2>
          {affiliateStats.length > 0 ? <MultiBarChart affiliateStats={affiliateStats} months={months} /> : <p className="text-gray-400 text-sm text-center py-8">Chưa có dữ liệu</p>}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">🏆 Top khách hàng</h2>
          {topByCustomers.length > 0
            ? <BarChart data={topByCustomers} valueKey="totalCustomers" labelKey="name" color="#3b82f6" suffix=" khách" />
            : <p className="text-gray-400 text-sm text-center py-8">Chưa có dữ liệu</p>}
        </div>
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">💰 Doanh thu cao nhất</h2>
          {topByRevenue.length > 0
            ? <BarChart data={topByRevenue} valueKey="totalRevenue" labelKey="name" color="#10b981" />
            : <p className="text-gray-400 text-sm text-center py-8">Chưa có dữ liệu</p>}
        </div>
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">🎁 Hoa hồng cao nhất</h2>
          {topByCommission.length > 0
            ? <BarChart data={topByCommission} valueKey="totalCommission" labelKey="name" color="#f59e0b" />
            : <p className="text-gray-400 text-sm text-center py-8">Chưa có dữ liệu</p>}
        </div>
      </div>

      {/* Affiliate table */}
      {affiliateStats.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">📋 Chi tiết theo Affiliate</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-gray-100">
                <th className="table-header text-left">Affiliate</th>
                <th className="table-header text-center">Khách</th>
                <th className="table-header text-center">Đã TT</th>
                <th className="table-header text-right">Doanh thu</th>
                <th className="table-header text-right">Hoa hồng</th>
                <th className="table-header text-right">Còn lại</th>
              </tr></thead>
              <tbody>{affiliateStats.map((a: any) => (
                <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="table-cell">
                    <p className="font-medium">{a.name}</p>
                    <p className="text-xs text-gray-400">{a.affiliateCode} · {a.commission}%</p>
                  </td>
                  <td className="table-cell text-center font-medium">{a.totalCustomers}</td>
                  <td className="table-cell text-center">{a.paidOrders}</td>
                  <td className="table-cell text-right">{fmt(a.totalRevenue)}</td>
                  <td className="table-cell text-right text-orange-600">{fmt(a.totalCommission)}</td>
                  <td className="table-cell text-right font-semibold text-red-600">{fmt(a.remaining)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
