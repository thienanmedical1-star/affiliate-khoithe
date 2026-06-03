import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'KhoiThe Affiliate System',
  description: 'Hệ thống quản lý affiliate KhoiThe',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  )
}
