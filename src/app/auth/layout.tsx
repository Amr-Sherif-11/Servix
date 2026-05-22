export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans relative min-h-screen">
        
        {children}
      </body>
    </html>
  )
}
