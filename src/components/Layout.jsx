export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">{children}</div>
      <footer className="py-4 text-center">
        <p className="text-[10px] text-ink-muted font-sans tracking-widest">
          © 2025 颜迹 All Rights Reserved · 未经授权禁止复制或转载
        </p>
      </footer>
    </div>
  )
}
