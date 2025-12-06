import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Painel Revendedor LKL',
    description: 'Sistema de geração de licenças',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="pt-br">
            <body className={`${inter.className} bg-black text-white min-h-screen`}>{children}</body>
        </html>
    )
}
