export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* 手机底部导航高度补偿 */}
      <div className="flex-1 pb-16 md:pb-0">{children}</div>
      <footer className="py-4 text-center mb-16 md:mb-0">
        <p className="text-[10px] text-ink-muted font-sans tracking-widest">
          © 2025 颜迹 All Rights Reserved · 未经授权禁止复制或转载
        </p>
      </footer>
    </div>
  )
}
