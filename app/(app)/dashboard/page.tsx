import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

function fmt(n: number) { return n.toLocaleString('vi-VN') + 'đ' }

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value!
  const session = verifyToken(token)!

  const isAdmin = session.role === 'ADMIN'

  let stats: any = {}
  if (isAdmin) {
    const [customers, orders, payments, affiliates] = await Promise.all([
      prisma.customer.count(),
      prisma.order.findMany(),
      prisma.commissionPayment.findMany(),
      prisma.user.findMany({ where: { role: 'AFFILIATE' }, include: { customers: true, orders: true, commissionPayments: true } }),
    ])
    const paid = orders.filter(o => o.paymentStatus === 'PAID')
    stats = {
      totalCustomers: customers,
      totalOrders: orders.length,
      paidOrders: paid.length,
      unpaidOrders: orders.filter(o => o.paymentStatus === 'UNPAID').length,
      totalRevenue: paid.reduce((s, o) => s + o.price, 0),
      totalCommission: paid.reduce((s, o) => s + o.commission, 0),
      totalPaid: payments.reduce((s, p) => s + p.amount, 0),
      affiliates: affiliates.map(a => ({
        name: a.name, affiliateCode: a.affiliateCode,
        customers: a.customers.length,
        paidOrders: a.orders.filter(o => o.paymentStatus === 'PAID').length,
        revenue: a.orders.filter(o => o.paymentStatus === 'PAID').reduce((s, o) => s + o.price, 0),
        commission: a.orders.filter(o => o.paymentStatus === 'PAID').reduce((s, o) => s + o.commission, 0),
        paid: a.commissionPayments.reduce((s, p) => s + p.amount, 0),
      })),
    }
  } else {
    const [orders, payments, affiliate] = await Promise.all([
      prisma.order.findMany({ where: { affiliateId: session.userId }, include: { customer: true, package: true } }),
      prisma.commissionPayment.findMany({ where: { affiliateId: session.userId } }),
      prisma.user.findUnique({ where: { id: session.userId } }),
    ])
    const paid = orders.filter(o => o.paymentStatus === 'PAID')
    stats = {
      commissionRate: affiliate?.commission,
      totalCustomers: await prisma.customer.count({ where: { affiliateId: session.userId } }),
      paidOrders: paid.length,
      unpaidOrders: orders.filter(o => o.paymentStatus === 'UNPAID').length,
      totalRevenue: paid.reduce((s, o) => s + o.price, 0),
      totalCommission: paid.reduce((s, o) => s + o.commission, 0),
      totalPaid: payments.reduce((s, p) => s + p.amount, 0),
      orders,
    }
  }

  const remaining = stats.totalCommission - stats.totalPaid

  const statCards = isAdmin ? [
    { label: 'Tổng khách', value: stats.totalCustomers, color: 'bg-blue-50 text-blue-700' },
    { label: 'Đã thanh toán', value: stats.paidOrders + ' đơn', color: 'bg-green-50 text-green-700' },
    { label: 'Chưa thanh toán', value: stats.unpaidOrders + ' đơn', color: 'bg-yellow-50 text-yellow-700' },
    { label: 'Tổng doanh thu', value: fmt(stats.totalRevenue), color: 'bg-purple-50 text-purple-700' },
    { label: 'Hoa hồng phát sinh', value: fmt(stats.totalCommission), color: 'bg-orange-50 text-orange-700' },
    { label: 'Hoa hồng còn lại', value: fmt(remaining), color: 'bg-red-50 text-red-700' },
  ] : [
    { label: 'Tỷ lệ hoa hồng', value: stats.commissionRate + '%', color: 'bg-blue-50 text-blue-700' },
    { label: 'Tổng khách', value: stats.totalCustomers, color: 'bg-indigo-50 text-indigo-700' },
    { label: 'Đã thanh toán', value: stats.paidOrders + ' đơn', color: 'bg-green-50 text-green-700' },
    { label: 'Doanh thu', value: fmt(stats.totalRevenue), color: 'bg-purple-50 text-purple-700' },
    { label: 'Hoa hồng phát sinh', value: fmt(stats.totalCommission), color: 'bg-orange-50 text-orange-700' },
    { label: 'Hoa hồng còn lại', value: fmt(remaining), color: 'bg-red-50 text-red-700' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Xin chào, {session.name} 👋</h1>
      <p className="text-gray-500 text-sm mb-6">{isAdmin ? 'Tổng quan toàn hệ thống' : `Tỷ lệ hoa hồng của bạn: ${stats.commissionRate}%`}</p>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statCards.map((s, i) => (
          <div key={i} className={`card ${s.color} border-0`}>
            <p className="text-xs font-medium opacity-70 mb-1">{s.label}</p>
            <p className="text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {isAdmin && stats.affiliates?.length > 0 && (
        <div className="card">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Theo Affiliate</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-gray-100">
                <th className="table-header text-left rounded-l">Affiliate</th>
                <th className="table-header text-center">Khách</th>
                <th className="table-header text-center">Đã TT</th>
                <th className="table-header text-right">Doanh thu</th>
                <th className="table-header text-right">Hoa hồng</th>
                <th className="table-header text-right rounded-r">Còn lại</th>
              </tr></thead>
              <tbody>{stats.affiliates.map((a: any, i: number) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="table-cell font-medium">{a.name} <span className="text-xs text-gray-400">({a.affiliateCode})</span></td>
                  <td className="table-cell text-center">{a.customers}</td>
                  <td className="table-cell text-center">{a.paidOrders}</td>
                  <td className="table-cell text-right">{fmt(a.revenue)}</td>
                  <td className="table-cell text-right">{fmt(a.commission)}</td>
                  <td className="table-cell text-right font-medium text-red-600">{fmt(a.commission - a.paid)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {!isAdmin && stats.orders?.length > 0 && (
        <div className="card">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Đơn hàng của tôi</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-gray-100">
                <th className="table-header text-left">Khách hàng</th>
                <th className="table-header text-left">Gói</th>
                <th className="table-header text-right">Giá bán</th>
                <th className="table-header text-center">Thanh toán</th>
                <th className="table-header text-right">Hoa hồng</th>
              </tr></thead>
              <tbody>{stats.orders.map((o: any) => (
                <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="table-cell font-medium">{o.customer?.name}<div className="text-xs text-gray-400">{o.customer?.phone}</div></td>
                  <td className="table-cell text-gray-500">{o.package?.name || 'Tùy chỉnh'}</td>
                  <td className="table-cell text-right">{fmt(o.price)}</td>
                  <td className="table-cell text-center">
                    <span className={o.paymentStatus === 'PAID' ? 'badge-paid' : 'badge-unpaid'}>
                      {o.paymentStatus === 'PAID' ? 'Đã TT' : 'Chưa TT'}
                    </span>
                  </td>
                  <td className="table-cell text-right font-medium text-green-600">
                    {o.paymentStatus === 'PAID' ? fmt(o.commission) : '—'}
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
