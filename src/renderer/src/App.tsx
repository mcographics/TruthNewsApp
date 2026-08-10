import { Route, Routes, useNavigate } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { EmptyState, LoadingScreen } from './components/ui'
import { useApp } from './context/AppContext'
import { BiblePage } from './pages/BiblePage'
import { DashboardPage } from './pages/DashboardPage'
import { BookmarksPage, DispensationsPage, PropheciesPage, SourcesPage, WatchPage } from './pages/KnowledgePages'
import { NewsPage } from './pages/NewsPage'
import { SettingsPage } from './pages/SettingsPage'
import { TimelinePage } from './pages/TimelinePages'

const NotFound = (): React.JSX.Element => {
  const navigate = useNavigate()
  return <div className="page"><EmptyState title="Page not found" detail="This destination is not part of the current desktop application." action={<button className="gold-button" onClick={() => navigate('/')}>Return to Dashboard</button>} /></div>
}

const App = (): React.JSX.Element => {
  const { loading } = useApp()
  if (loading) return <LoadingScreen />
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/timeline/master" element={<TimelinePage mode="master" />} />
        <Route path="/timeline/prophecy" element={<TimelinePage mode="prophecy" />} />
        <Route path="/timeline/bible" element={<TimelinePage mode="bible" />} />
        <Route path="/timeline/history" element={<TimelinePage mode="history" />} />
        <Route path="/jesus" element={<TimelinePage mode="jesus" />} />
        <Route path="/dispensations" element={<DispensationsPage />} />
        <Route path="/bible" element={<BiblePage />} />
        <Route path="/prophecies" element={<PropheciesPage />} />
        <Route path="/watch" element={<WatchPage />} />
        <Route path="/bookmarks" element={<BookmarksPage />} />
        <Route path="/sources" element={<SourcesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppShell>
  )
}

export default App
