import { useEffect, useState, type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { StatusFooter } from './StatusFooter'
import { TopBar } from './TopBar'
import { useApp } from '../context/AppContext'
import { ErrorState } from './ui'

export const AppShell = ({ children }: { children: ReactNode }): React.JSX.Element => {
  const { settings, error, reload } = useApp()
  const [windowMaximized, setWindowMaximized] = useState(false)

  useEffect(() => {
    let active = true
    void window.truthNews.getWindowState().then((state) => {
      if (active) setWindowMaximized(state.maximized)
    })
    const removeListener = window.truthNews.onWindowState((state) => setWindowMaximized(state.maximized))
    return () => {
      active = false
      removeListener()
    }
  }, [])

  return (
    <div className={`app-shell ${settings.sidebarCollapsed ? 'sidebar-is-collapsed' : ''} ${windowMaximized ? 'window-is-maximized' : ''}`}>
      <Sidebar />
      <TopBar />
      <main className="app-content">{error && <ErrorState message={error} retry={() => void reload()} />}{children}</main>
      <StatusFooter />
    </div>
  )
}
