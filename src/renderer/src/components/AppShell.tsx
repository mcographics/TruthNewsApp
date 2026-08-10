import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { StatusFooter } from './StatusFooter'
import { TopBar } from './TopBar'
import { useApp } from '../context/AppContext'
import { ErrorState } from './ui'

export const AppShell = ({ children }: { children: ReactNode }): React.JSX.Element => {
  const { settings, error, reload } = useApp()
  return (
    <div className={`app-shell ${settings.sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
      <Sidebar />
      <TopBar />
      <main className="app-content">{error && <ErrorState message={error} retry={() => void reload()} />}{children}</main>
      <StatusFooter />
    </div>
  )
}
