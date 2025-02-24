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
    <html lang="en" className={`${GeistSans.className} h-full`} suppressHydrationWarning>
      <head>
        <Script
          src="https://cdn.seline.so/seline.js"
          data-token="f7b735001f8ecbe"
          strategy="afterInteractive"
        />
      </head>
      <body className="antialiased bg-white dark:bg-black h-full m-0">
        <AuthProvider>
          <main className="h-full">
            {children}
          </main>
        </AuthProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark')
              } else {
                document.documentElement.classList.remove('dark')
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
