import { GeistSans } from 'geist/font/sans'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'
import Script from 'next/script'

export const metadata = {
  title: 'Dail',
  description: 'Simple calendar app',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={GeistSans.className}>
      <head>
        <Script
          src="https://cdn.seline.so/seline.js"
          data-token="f7b735001f8ecbe"
          strategy="afterInteractive"
        />
      </head>
      <body className="m-0 p-0">
        <AuthProvider>
          <main className="h-full">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  )
}
