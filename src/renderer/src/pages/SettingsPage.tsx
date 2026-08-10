import { AlertTriangle, Clock3, Database, Eraser, Globe2, Monitor, Moon, RefreshCw, Shield, Sun, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { AppSettings } from '../../../shared/types'
import { DetailDrawer, Panel } from '../components/ui'
import { useApp } from '../context/AppContext'

type ConfirmAction = 'news' | 'activity' | 'reset' | null

export const SettingsPage = (): React.JSX.Element => {
  const { settings, updateSettings, clearNews, clearActivity, resetLocalData, news, bookmarks, notes, sources, bibleTranslations } = useApp()
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const [time, setTime] = useState<{ local: string; utc: string; timezone: string; iso: string } | null>(null)
  const [working, setWorking] = useState(false)

  useEffect(() => {
    const update = (): void => { void window.truthNews.getTime().then(setTime) }
    update()
    const timer = window.setInterval(update, 1_000)
    return () => window.clearInterval(timer)
  }, [])

  const change = <K extends keyof AppSettings>(key: K, value: AppSettings[K]): void => { void updateSettings({ [key]: value } as Pick<AppSettings, K>) }
  const runConfirmed = async (): Promise<void> => {
    setWorking(true)
    try {
      if (confirmAction === 'news') await clearNews()
      if (confirmAction === 'activity') await clearActivity()
      if (confirmAction === 'reset') await resetLocalData()
      setConfirmAction(null)
    } finally { setWorking(false) }
  }
  const confirmCopy = confirmAction === 'news'
    ? { title: 'Clear downloaded news?', detail: `This removes ${news.length} locally cached article records. Your feeds and settings remain configured.` }
    : confirmAction === 'activity'
      ? { title: 'Clear bookmarks and notes?', detail: `This permanently removes ${bookmarks.length} bookmark${bookmarks.length === 1 ? '' : 's'} and ${notes.length} note${notes.length === 1 ? '' : 's'} from this device.` }
      : { title: 'Reset all local application data?', detail: 'This recreates the SQLite database, restores default settings and sources, removes synchronized news, bookmarks, notes, and any lazily imported translation data. The offline Scripture library remains available for reimport.' }

  return <div className="page settings-page"><header className="page-header"><div><span className="eyebrow">Device-local configuration</span><h1>Settings</h1><p>Appearance, synchronization, Bible, timeline, region, accessibility, and privacy controls. No sign-in or remote preference account is used.</p></div><div className="privacy-chip"><Shield /><span><strong>Local-first privacy</strong><small>Preferences and personal research stay on this device.</small></span></div></header>
    <div className="settings-grid">
      <Panel title="Appearance" className="settings-card"><div className="theme-options"><button className={settings.theme === 'dark-gold' ? 'active' : ''} onClick={() => change('theme', 'dark-gold')}><Moon /><strong>Dark Gold</strong><small>Flat muted near-black surfaces with restrained warm gold.</small></button><button className={settings.theme === 'white-gold' ? 'active' : ''} onClick={() => change('theme', 'white-gold')}><Sun /><strong>White Gold</strong><small>Warm ivory surfaces with charcoal type.</small></button><button className={settings.theme === 'system' ? 'active' : ''} onClick={() => change('theme', 'system')}><Monitor /><strong>System Theme</strong><small>Follow the current Windows appearance.</small></button></div><label className="setting-row"><span><strong>Reduced motion</strong><small>Minimize transitions and animated feedback.</small></span><span className="switch"><input type="checkbox" checked={settings.reducedMotion} onChange={(event) => change('reducedMotion', event.target.checked)} /><i /></span></label></Panel>
      <Panel title="News synchronization" className="settings-card"><label className="setting-row"><span><strong>Refresh frequency</strong><small>Applies while the desktop app is running.</small></span><select value={settings.refreshMinutes} onChange={(event) => change('refreshMinutes', Number(event.target.value))}><option value={15}>Every 15 minutes</option><option value={30}>Every 30 minutes</option><option value={60}>Every hour</option><option value={120}>Every 2 hours</option><option value={240}>Every 4 hours</option></select></label><div className="setting-stat"><RefreshCw /><span><strong>{sources.filter((source) => source.category === 'news' && source.enabled).length} approved feeds enabled</strong><small>Manage individual feeds on the Sources page.</small></span></div><div className="setting-stat"><Database /><span><strong>{news.length} cached article records</strong><small>Metadata and summaries supplied by publisher feeds.</small></span></div></Panel>
      <Panel title="Bible & timeline" className="settings-card"><label className="setting-row"><span><strong>Default translation</strong><small>Used by the Bible reader and global Scripture search.</small></span><select value={settings.defaultBible} onChange={(event) => change('defaultBible', event.target.value)}>{bibleTranslations.filter((translation) => translation.format === 'text').map((translation) => <option key={translation.code} value={translation.code}>{translation.abbreviation} — {translation.name}</option>)}</select></label><label className="setting-row"><span><strong>Date display</strong><small>Historical events retain their own date-type metadata.</small></span><select value={settings.dateFormat} onChange={(event) => change('dateFormat', event.target.value === 'short' ? 'short' : 'long')}><option value="long">Long dates</option><option value="short">Short dates</option></select></label><div className="setting-stat"><Database /><span><strong>{bibleTranslations.filter((translation) => translation.format === 'text').length} searchable editions · {bibleTranslations.filter((translation) => translation.format === 'facsimile').length} facsimile</strong><small>Translation packs import locally when selected; no cloud account is involved.</small></span></div></Panel>
      <Panel title="Region & real-world time" className="settings-card"><label className="setting-row"><span><strong>Country</strong><small>Used for regional defaults and display context.</small></span><select value={settings.country} onChange={(event) => change('country', event.target.value)}><option>Canada</option><option>United States</option><option>Israel</option><option>United Kingdom</option><option>Australia</option></select></label><label className="setting-row"><span><strong>Timezone</strong><small>IANA timezone used for synchronized timestamps.</small></span><select value={settings.timezone} onChange={(event) => change('timezone', event.target.value)}><option>America/Toronto</option><option>America/Edmonton</option><option>America/Vancouver</option><option>America/New_York</option><option>America/Chicago</option><option>America/Denver</option><option>America/Los_Angeles</option><option>Asia/Jerusalem</option><option>UTC</option></select></label>{time && <div className="time-readout"><Clock3 /><span><strong>{time.local}</strong><small>UTC: {time.utc} · System: {time.timezone}</small></span></div>}</Panel>
      <Panel title="Privacy & local data" className="settings-card privacy-settings"><div className="privacy-actions"><button onClick={() => setConfirmAction('news')}><Eraser /><span><strong>Clear news cache</strong><small>Remove downloaded publisher feed records.</small></span></button><button onClick={() => setConfirmAction('activity')}><Trash2 /><span><strong>Clear bookmarks and notes</strong><small>Remove your local research activity.</small></span></button><button className="danger" onClick={() => setConfirmAction('reset')}><AlertTriangle /><span><strong>Reset all local data</strong><small>Restore the application to its initial state.</small></span></button></div></Panel>
      <Panel title="About TruthNewsApp" className="settings-card about-settings"><div className="about-content"><div className="about-mark">T</div><div className="about-copy"><h2>TruthNewsApp</h2><p>Truth. History. Prophecy. News.</p><dl><div><dt>Version</dt><dd>0.2.0 MVP</dd></div><div><dt>Platform</dt><dd>Windows desktop · Electron</dd></div><div><dt>Data model</dt><dd>Local-first SQLite</dd></div><div><dt>Bible library</dt><dd>{bibleTranslations.length || 'Loading'} offline editions and resources</dd></div><div><dt>Editorial direction</dt><dd>Christian · Biblical · Conservative</dd></div></dl></div></div></Panel>
    </div>
    {confirmAction && <DetailDrawer title={confirmCopy.title} subtitle="Destructive local action" onClose={() => !working && setConfirmAction(null)}><div className="confirm-danger"><AlertTriangle /><p>{confirmCopy.detail}</p></div><div className="drawer-actions"><button className="gold-button" disabled={working} onClick={() => setConfirmAction(null)}>Cancel</button><button className="danger-button" disabled={working} onClick={() => void runConfirmed()}>{working ? 'Working…' : 'Confirm'}</button></div></DetailDrawer>}
  </div>
}
