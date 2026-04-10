export default function Layout({ children }) {
  return (
    <>
      {children}
      {/* 版权栏：手机在底部导航上方，桌面在页面最底部 */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 text-center py-2 pointer-events-none z-30">
        <p className="text-[9px] text-ink-muted/50 font-sans tracking-widest">
          © 2025 颜迹 All Rights Reserved · 未经授权禁止复制或转载
        </p>
      </div>
    </>
  )
}
