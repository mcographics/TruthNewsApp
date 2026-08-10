import { Clock3, Cross, Globe2, RefreshCw, ShieldCheck } from 'lucide-react'
import { useApp } from '../context/AppContext'

export const StatusFooter = (): React.JSX.Element => {
  const { sync, sources, syncing, refreshNews } = useApp()
  const trusted = sources.filter((source) => source.enabled).length
  return (
    <footer className="status-footer">
      <div><Globe2 /><span><strong>Real-Time Connection</strong><small>{sync.online ? 'Connected to approved feeds' : 'Offline local-first mode'}</small></span></div>
      <div><ShieldCheck /><span><strong>Verified Sources</strong><small>{trusted} enabled source records</small></span></div>
      <div><Cross /><span><strong>Biblical Accuracy</strong><small>Scripture references linked</small></span></div>
      <button onClick={() => void refreshNews()} disabled={syncing}><RefreshCw className={syncing ? 'spin' : ''} /><span><strong>Update Frequency</strong><small>{syncing ? 'Synchronizing now…' : 'Manual refresh available'}</small></span></button>
      <div className="footer-time"><Clock3 /><span><strong>{sync.lastNewsSync ? `Last updated ${new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(sync.lastNewsSync))}` : 'Not synchronized yet'}</strong><small className={sync.online ? 'connected' : 'offline'}>{sync.online ? '● Connected' : '● Offline'}</small></span></div>
    </footer>
  )
}
