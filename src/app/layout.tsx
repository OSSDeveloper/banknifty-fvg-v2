import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'BankNifty Chart with FVG',
  description: 'BankNifty 15-min chart with Fair Value Gap indicators',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#0f0f1a' }}>{children}</body>
    </html>
  )
}
