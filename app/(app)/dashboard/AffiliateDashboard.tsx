import { prisma } from '@/lib/prisma'

function fmt(n: number) { return n.toLocaleString('vi-VN') + 'đ' }

export default async function AffiliateDashboard({ session }: { session: any }) {
  const [orders, payments, affiliate] = await Promise.all([
    prisma.order.findMany({ where: { affiliateId: session.userId }, include: { customer: true, package: true } }),
    prisma.commissionPayment.findMany({ where: { affiliateId: session.userId } }),
    prisma.user.findUnique({ where: { id: session.userId } }),
  ])
  const totalCustomers = await prisma.customer.count({ where: { affiliateId: session.userId } })
  const paid = orders.filter(o => o.paymentStatus === 'PAID')
  const totalRevenue = paid.reduce((s, o) => s + o.price, 0)
  const totalCommission = paid.reduce((s, o) => s + o.commission, 0)
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0)

  const cards = [
    { label: 'Tỷ lệ hoa hồng', value: affiliate?.commission + '%', color: 'bg-blue-50 text-blue-700' },
    { label: 'Tổng khách', value: totalCustomers, color: 'bg-indigo-50 text-indigo-700' },
    { label: 'Đã thanh toán', value: paid.length + ' đơn', color: 'bg-green-50 text-green-700' },
    { label: 'Doanh thu', value: fmt(totalRevenue), color: 'bg-purple-50 text-purple-700' },
    { label: 'Hoa hồng phát sinh', value: fmt(totalCommission), color: 'bg-orange-50 text-orange-700' },
    { label: 'Hoa hồng còn lại', value: fmt(totalCommission - totalPaid), color: 'bg-red-50 text-red-700' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Xin chào, {session.name} 👋</h1>
      <p className="text-gray-500 text-sm mb-6">Tỷ lệ hoa hồng: {affiliate?.commission}%</p>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map((s, i) => (
          <div key={i} className={`card ${s.color} border-0`}>
            <p className="text-xs font-medium opacity-70 mb-1">{s.label}</p>
            <p className="text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>
      {orders.length > 0 && (
        <div className="card">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Đơn hàng gần đây</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-gray-100">
                <th className="table-header text-left">Khách hàng</th>
                <th className="table-header text-left">Gói</th>
                <th className="table-header text-right">Giá bán</th>
                <th className="table-header text-center">Thanh toán</th>
                <th className="table-header text-right">Hoa hồng</th>
              </tr></thead>
              <tbody>{orders.slice(0, 10).map(o => (
                <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="table-cell font-medium">{o.customer?.name}<div className="text-xs text-gray-400">{o.customer?.phone}</div></td>
                  <td className="table-cell text-gray-500">{o.package?.name || 'Tùy chỉnh'}</td>
                  <td className="table-cell text-right">{fmt(o.price)}</td>
                  <td className="table-cell text-center"><span className={o.paymentStatus === 'PAID' ? 'badge-paid' : 'badge-unpaid'}>{o.paymentStatus === 'PAID' ? 'Đã TT' : 'Chưa TT'}</span></td>
                  <td className="table-cell text-right font-medium text-green-600">{o.paymentStatus === 'PAID' ? fmt(o.commission) : '—'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
