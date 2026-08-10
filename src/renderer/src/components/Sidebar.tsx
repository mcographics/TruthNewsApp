import {
  BookOpen, Bookmark, BookOpenText, CalendarRange, ChevronLeft, ChevronRight, Clock3, Flame, History, Home,
  Library, Newspaper, PlaySquare, Settings, ShieldCheck, Sparkles, Telescope
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/news', label: 'News Feed', icon: Newspaper },
  { to: '/timeline/master', label: 'Master Timeline', icon: CalendarRange },
  { to: '/timeline/prophecy', label: 'Prophetic Timeline', icon: Flame },
  { to: '/timeline/bible', label: 'Bible Timeline', icon: BookOpenText },
  { to: '/timeline/history', label: 'History Timeline', icon: History },
  { to: '/jesus', label: 'Jesus Christ', icon: Sparkles },
  { to: '/dispensations', label: 'Dispensations', icon: Clock3 },
  { to: '/bible', label: 'Bible', icon: BookOpen },
  { to: '/prophecies', label: 'Verified Prophecies', icon: ShieldCheck },
  { to: '/watch', label: 'Watch & Learn', icon: PlaySquare },
  { to: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { to: '/sources', label: 'Sources', icon: Library },
  { to: '/settings', label: 'Settings', icon: Settings }
]

export const Sidebar = (): React.JSX.Element => {
  const { settings, updateSettings } = useApp()
  const collapsed = settings.sidebarCollapsed
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <NavLink to="/" className="brand" aria-label="TruthNewsApp dashboard">
        <div className="brand-symbol"><span className="initial-letter">T</span><BookOpenText className="brand-book" size={31} /></div>
        {!collapsed && <div><strong>TruthNewsApp</strong><span>Truth. History. Prophecy. News.</span></div>}
      </NavLink>
      <nav className="primary-nav" aria-label="Main navigation">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title={collapsed ? label : undefined}>
            <Icon size={19} /><span>{label}</span>
          </NavLink>
        ))}
      </nav>
      {!collapsed && (
        <div className="sidebar-verse"><Telescope size={20} /><blockquote>“Sanctify them in the truth; your word is truth.”</blockquote><cite>John 17:17 · WEB</cite></div>
      )}
      <button className="collapse-button" onClick={() => void updateSettings({ sidebarCollapsed: !collapsed })} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
        {collapsed ? <ChevronRight size={18} /> : <><ChevronLeft size={18} /><span>Collapse sidebar</span></>}
      </button>
    </aside>
  )
}
