# TruthNewsApp visual tour

TruthNewsApp brings current publisher-attributed news, offline Scripture, evidence-aware history, and carefully classified prophecy research into one account-free Windows desktop application. Its Dark Gold theme uses flat, muted near-black and charcoal surfaces with warm gold accents—without interface gradients. This tour covers the packaged app from startup through every primary destination and the major drawers, popovers, settings, themes, and navigation states.

These images were captured from the Windows x64 package for TruthNewsApp 0.2.0 on August 10, 2026 at 2000 × 1250. Live headlines, article counts, feed timestamps, and the system clock naturally change between runs. The capture used a clean, isolated local profile; no personal account or cloud profile is required.

## Startup and dashboard

### Branded startup splash

The rounded startup window uses the dedicated TruthNewsApp splash artwork for a clear application handoff.

![TruthNewsApp startup splash](screenshots/00-startup-splash.png)

### Main-window loading state

The illuminated cross appears while the main window prepares the local database, Scripture catalogue, timelines, and synchronized news state.

![TruthNewsApp cross loading screen](screenshots/01-loading-cross.png)

### Dashboard

The primary dashboard combines current headlines, direct research entry points, a prophetic timeline overview, verified-prophecy records, and the current dispensational context.

![TruthNewsApp dashboard](screenshots/02-dashboard.jpg)

### Lower dashboard research panels

The lower dashboard continues with Jesus Christ life-timeline cards, the current dispensation, and the broader dispensational framework.

![Lower TruthNewsApp dashboard](screenshots/03-dashboard-lower.jpg)

## Global tools

### Cross-library search

Global search spans local Scripture, history, prophecy, dispensations, sources, and synchronized news while labeling the type and origin of each result.

![Global search results](screenshots/04-global-search.jpg)

### Updates and synchronization

The updates popover reports the state of the local cache and approved-source synchronization.

![Latest updates popover](screenshots/05-notifications.jpg)

### Account-free local profile

The profile control makes the privacy model explicit: bookmarks, notes, and preferences stay on this PC without a sign-in.

![Local application profile popover](screenshots/06-local-profile.jpg)

## News and evidence

### News Feed

News cards preserve publisher attribution, dates, categories, opinion labels, and retrieval metadata. The feed stores supplied metadata and links rather than presenting publisher reporting as original TruthNewsApp reporting.

![TruthNewsApp News Feed](screenshots/07-news-feed.jpg)

### News evidence drawer

Opening a story exposes its publisher record, retrieval details, and research boundaries. Editorial analysis and prophecy relevance remain explicitly unassigned until they have been reviewed.

![News evidence drawer](screenshots/08-news-evidence.jpg)

## Timelines and historical context

### Global Master Timeline

The combined timeline supports category overlays, filtering, zoom controls, horizontal exploration, and visible confidence labels for exact, approximate, disputed, and unknown dates.

![Global Master Timeline](screenshots/09-master-timeline.jpg)

### Historical event evidence

An event drawer brings together the qualified date, summary, Scripture references, location, related records, supporting sources, and a device-local personal note.

![Historical event evidence drawer](screenshots/10-event-evidence.jpg)

### Prophetic Timeline

The prophecy timeline keeps the original prophecy, proposed fulfillment, and interpretive classification visibly distinct.

![Prophetic Timeline](screenshots/11-prophetic-timeline.jpg)

### Prophecy evidence chain

The evidence chain follows a claim from the spoken prophecy through context, proposed fulfillment, classification, supporting evidence, and present relevance.

![Prophecy evidence chain drawer](screenshots/12-prophecy-evidence-chain.jpg)

### Bible Timeline

The biblical chronology focuses on Bible, Jesus Christ, and Church History records from Genesis through Revelation while preserving disputed and approximate date labels.

![Bible Timeline](screenshots/13-bible-timeline.jpg)

### History Timeline

World History, Israel, and Church History can be compared in one chronology without converting interpretive dates into manufactured certainty.

![History Timeline](screenshots/14-history-timeline.jpg)

### Jesus Christ: Life & Ministry

The focused Gospel chronology follows major events in the birth, public ministry, crucifixion, resurrection, and ascension of Jesus Christ.

![Jesus Christ life and ministry timeline](screenshots/15-jesus-timeline.jpg)

## Dispensational framework

### Framework overview

TruthNewsApp identifies the displayed model as a chosen classic premillennial dispensational framework rather than presenting it as universal Christian agreement.

![Dispensational framework overview](screenshots/16-dispensations.jpg)

### Expanded dispensation

Each section can disclose its governing principle, human responsibility, key figures, covenants, events, Scripture, transition, and prophetic significance.

![Expanded dispensation details](screenshots/17-dispensation-details.jpg)

## Offline Scripture library

### Bible Reader

The reader offers translation, book, and chapter navigation across the bundled public-domain and freely distributable editions. Translation packs are imported into the device-local database when selected.

![Offline Bible Reader showing John 3](screenshots/18-bible-reader.jpg)

### Verse study

The verse drawer supports copying, bookmarking, reviewed timeline connections, and private local notes while keeping the active translation visible.

![John 3:16 verse study drawer](screenshots/19-verse-study.jpg)

### Translation-aware search

Bible search runs locally against the selected edition and identifies the translation beside every result.

![Local Bible search results](screenshots/20-bible-search.jpg)

### Geneva Bible 1560 facsimile

The supplied 1,224-page historical scan is clearly described as an image facsimile. The app does not misrepresent it as reliable OCR-derived, searchable Scripture text.

![Geneva Bible 1560 facsimile panel](screenshots/21-geneva-facsimile.jpg)

## Prophecy and learning resources

### Verified Prophecies

Classification filters and evidence-aware cards make fulfillment claims inspectable and qualified.

![Verified Prophecies page](screenshots/22-verified-prophecies.jpg)

### Full prophecy record

The record drawer exposes the evidence chain, related history, interpretation, classification, source material, and personal note space.

![Full prophecy record drawer](screenshots/23-prophecy-record.jpg)

### Watch & Learn

Curated external resources and study topics carry a clear review-required boundary instead of appearing as silently endorsed embedded media.

![Watch and Learn page](screenshots/24-watch-and-learn.jpg)

## Sources and personal research

### Source registry

Every registered publisher, biblical, historical, and government source includes a description, reliability note, rights or terms note, link, and—where applicable—feed status and an enable control.

![Source registry](screenshots/25-sources.jpg)

### Additional source records

The complete registry remains inspectable as it continues down the page, including retrieval state and links to original sources.

![Lower source registry](screenshots/26-sources-lower.jpg)

### Local bookmarks

Saved news, Scripture, prophecy, and source records form an account-free research collection stored on the PC.

![Local bookmarks collection](screenshots/27-local-bookmarks.jpg)

## Settings, privacy, and presentation

### Settings

Appearance, refresh frequency, default Bible edition, date display, country, timezone, reduced motion, and local-data controls live in one device-local settings area.

![TruthNewsApp settings](screenshots/28-settings.jpg)

### Privacy, data, and About

The lower settings view exposes cache and research-data controls alongside platform, version, local-data model, Bible-library size, and editorial-direction information.

![Privacy controls and About information](screenshots/29-settings-privacy.jpg)

### Protected reset confirmation

Destructive local actions require explicit confirmation and explain what will be removed before anything changes.

![Reset local data confirmation](screenshots/30-reset-confirmation.jpg)

### White Gold theme

The full interface can switch from flat, muted near-black Dark Gold to warm ivory White Gold while preserving contrast, hierarchy, and the restrained gold identity.

![White Gold dashboard theme](screenshots/31-white-gold-theme.jpg)

### Collapsed navigation

The sidebar can reduce to icon-only navigation, retain accessible names and tooltips, and return the recovered width to the primary workspace.

![Collapsed sidebar navigation](screenshots/32-collapsed-sidebar.jpg)

## Reproducing the showcase

Build the Windows package, point the capture command at the unpacked executable, and run the scripted tour:

```powershell
npm run dist:win
$env:TRUTHNEWS_EXECUTABLE = 'G:\TruthNewsApp\release\win-unpacked\TruthNewsApp.exe'
npm run capture:showcase
```

The capture script recreates `docs/screenshots/` from an isolated profile under `artifacts/showcase-profile/`. It also validates key route content, the About-card geometry, the collapsed brand mark, and the absence of the known RSS category-conversion failure before declaring the tour complete.
