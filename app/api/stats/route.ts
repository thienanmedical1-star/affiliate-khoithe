import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  try {
    await requireAdmin()

    const affiliates = await prisma.user.findMany({
      where: { role: 'AFFILIATE', isActive: true },
      include: {
        customers: true,
        orders: { include: { customer: true } },
        commissionPayments: true,
      },
    })

    // Monthly customers for last 6 months
    const now = new Date()
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      return {
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: `T${d.getMonth() + 1}/${d.getFullYear().toString().slice(2)}`,
        start: d,
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0),
      }
    })

    const affiliateStats = affiliates.map(a => {
      const paidOrders = a.orders.filter(o => o.paymentStatus === 'PAID')
      const totalRevenue = paidOrders.reduce((s, o) => s + o.price, 0)
      const totalCommission = paidOrders.reduce((s, o) => s + o.commission, 0)
      const totalPaid = a.commissionPayments.reduce((s, p) => s + p.amount, 0)

      const monthlyCustomers = months.map(m => ({
        month: m.label,
        count: a.customers.filter(c => {
          const d = new Date(c.registeredAt)
          return d >= m.start && d <= m.end
        }).length,
      }))

      return {
        id: a.id,
        name: a.name,
        affiliateCode: a.affiliateCode,
        commission: a.commission,
        totalCustomers: a.customers.length,
        paidOrders: paidOrders.length,
        totalRevenue,
        totalCommission,
        totalPaid,
        remaining: totalCommission - totalPaid,
        monthlyCustomers,
      }
    })

    // Overall monthly revenue
    const allOrders = await prisma.order.findMany({ where: { paymentStatus: 'PAID' } })
    const monthlyRevenue = months.map(m => ({
      month: m.label,
      revenue: allOrders.filter(o => {
        const d = new Date(o.paidAt || o.createdAt)
        return d >= m.start && d <= m.end
      }).reduce((s, o) => s + o.price, 0),
      commission: allOrders.filter(o => {
        const d = new Date(o.paidAt || o.createdAt)
        return d >= m.start && d <= m.end
      }).reduce((s, o) => s + o.commission, 0),
    }))

    return NextResponse.json({ affiliateStats, monthlyRevenue, months: months.map(m => m.label) })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
