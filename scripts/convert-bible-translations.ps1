param(
  [string]$SourceDirectory = (Join-Path $PSScriptRoot '..\bible-translations\Free'),
  [string]$OutputDirectory = (Join-Path $PSScriptRoot '..\src\main\data\translations')
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem

$books = [ordered]@{
  'Genesis' = 'GEN'; 'Exodus' = 'EXO'; 'Leviticus' = 'LEV'; 'Numbers' = 'NUM'; 'Deuteronomy' = 'DEU'
  'Joshua' = 'JOS'; 'Judges' = 'JDG'; 'Ruth' = 'RUT'; '1 Samuel' = '1SA'; '2 Samuel' = '2SA'
  '1 Kings' = '1KI'; '2 Kings' = '2KI'; '1 Chronicles' = '1CH'; '2 Chronicles' = '2CH'; 'Ezra' = 'EZR'
  'Nehemiah' = 'NEH'; 'Esther' = 'EST'; 'Job' = 'JOB'; 'Psalms' = 'PSA'; 'Psalm' = 'PSA'; 'Proverbs' = 'PRO'
  'Ecclesiastes' = 'ECC'; 'Songs' = 'SOL'; 'Song of Solomon' = 'SOL'; 'Isaiah' = 'ISA'; 'Jeremiah' = 'JER'; 'Lamentations' = 'LAM'
  'Ezekiel' = 'EZE'; 'Daniel' = 'DAN'; 'Hosea' = 'HOS'; 'Joel' = 'JOE'; 'Amos' = 'AMO'
  'Obadiah' = 'OBA'; 'Jonah' = 'JON'; 'Micah' = 'MIC'; 'Nahum' = 'NAH'; 'Habakkuk' = 'HAB'
  'Zephaniah' = 'ZEP'; 'Haggai' = 'HAG'; 'Zechariah' = 'ZEC'; 'Malachi' = 'MAL'; 'Matthew' = 'MAT'
  'Mark' = 'MAR'; 'Luke' = 'LUK'; 'John' = 'JOH'; 'Acts' = 'ACT'; 'Romans' = 'ROM'
  '1 Corinthians' = '1CO'; '2 Corinthians' = '2CO'; 'Galatians' = 'GAL'; 'Ephesians' = 'EPH'; 'Philippians' = 'PHI'
  'Colossians' = 'COL'; '1 Thessalonians' = '1TH'; '2 Thessalonians' = '2TH'; '1 Timothy' = '1TI'; '2 Timothy' = '2TI'
  'Titus' = 'TIT'; 'Philemon' = 'PHM'; 'Hebrews' = 'HEB'; 'James' = 'JAM'; '1 Peter' = '1PE'
  '2 Peter' = '2PE'; '1 John' = '1JO'; '2 John' = '2JO'; '3 John' = '3JO'; 'Jude' = 'JUD'; 'Revelation' = 'REV'
}

$editions = @(
  [ordered]@{ code='AKJV'; abbreviation='AKJV'; name='American King James Version'; file='akjv.docx'; scope='Complete Bible'; rights='Reuse permitted by the producer; attribution required and no exclusive copyright claim may be made.'; sourceUrl='https://biblehub.com/downloads.htm' },
  [ordered]@{ code='ASV'; abbreviation='ASV'; name='American Standard Version'; file='asv.docx'; scope='Complete Bible'; rights='Public domain.'; sourceUrl='https://biblehub.com/downloads.htm' },
  [ordered]@{ code='BIB'; abbreviation='BIB'; name='Berean Interlinear Bible'; file='bib.docx'; scope='New Testament'; rights='Public domain as declared by the Berean Bible project on April 30, 2023.'; sourceUrl='https://berean.bible/licensing.htm' },
  [ordered]@{ code='BLB'; abbreviation='BLB'; name='Berean Literal Bible'; file='blb.docx'; scope='New Testament'; rights='Public domain as declared by the Berean Bible project on April 30, 2023.'; sourceUrl='https://berean.bible/licensing.htm' },
  [ordered]@{ code='DBT'; abbreviation='DBT'; name='Darby Bible Translation'; file='dbt.docx'; scope='Complete Bible'; rights='Public domain.'; sourceUrl='https://biblehub.com/downloads.htm' },
  [ordered]@{ code='DRB'; abbreviation='DRB'; name='Douay-Rheims Bible'; file='drb.docx'; scope='Complete Bible'; rights='Public domain edition.'; sourceUrl='https://biblehub.com/downloads.htm' },
  [ordered]@{ code='ERV'; abbreviation='ERV'; name='English Revised Version'; file='erv.docx'; scope='Complete Bible'; rights='Public domain.'; sourceUrl='https://biblehub.com/downloads.htm' },
  [ordered]@{ code='JPS'; abbreviation='JPS/WNT'; name='JPS Tanakh 1917 / Weymouth New Testament'; file='jps.docx'; scope='Complete Bible'; rights='Public domain editions combined by the source document.'; sourceUrl='https://biblehub.com/downloads.htm' },
  [ordered]@{ code='KJV'; abbreviation='KJV'; name='King James Version'; file='kjv.docx'; scope='Complete Bible'; rights='Public domain in the United States and Canada; Crown rights can apply in the United Kingdom.'; sourceUrl='https://biblehub.com/downloads.htm' },
  [ordered]@{ code='SLT'; abbreviation='SLT'; name="Smith's Literal Translation"; file='slt.docx'; scope='Complete Bible'; rights='Public domain.'; sourceUrl='https://biblehub.com/downloads.htm' },
  [ordered]@{ code='WBT'; abbreviation='WBT'; name="Webster's Bible Translation"; file='wbt.docx'; scope='Complete Bible'; rights='Public domain.'; sourceUrl='https://biblehub.com/downloads.htm' },
  [ordered]@{ code='YLT'; abbreviation='YLT'; name="Young's Literal Translation"; file='ylt.docx'; scope='Complete Bible'; rights='Public domain.'; sourceUrl='https://biblehub.com/downloads.htm' }
)

$excludedParagraphStyles = @('acrostic', 'foot', 'hdg', 'subhdg', 'suphdg')
$bookPattern = '^(?<book>' + (($books.Keys | ForEach-Object { [regex]::Escape($_) }) -join '|') + ') (?<chapter>\d+)$'

function Get-NodeText([System.Xml.XmlNode]$Node, [System.Xml.XmlNamespaceManager]$Namespaces) {
  return (($Node.SelectNodes('.//w:t', $Namespaces) | ForEach-Object { $_.InnerText }) -join '')
}

function Write-GzipJson([object]$Value, [string]$Path) {
  $json = $Value | ConvertTo-Json -Depth 8 -Compress
  $bytes = [System.Text.UTF8Encoding]::new($false).GetBytes($json)
  $fileStream = [System.IO.File]::Create($Path)
  try {
    $gzip = [System.IO.Compression.GZipStream]::new($fileStream, [System.IO.Compression.CompressionLevel]::Optimal, $true)
    try { $gzip.Write($bytes, 0, $bytes.Length) } finally { $gzip.Dispose() }
  } finally { $fileStream.Dispose() }
}

New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$manifestEditions = [System.Collections.Generic.List[object]]::new()

$manifestEditions.Add([ordered]@{
  code='WEB'; abbreviation='WEB'; name='World English Bible'; format='text'; scope='Complete Bible';
  rights='Public domain. World English Bible is a trademark of eBible.org and Rainbow Missions, Inc.';
  sourceUrl='https://ebible.org/details.php?id=engwebp'; packFile=$null; resourceFile=$null; verseCount=31098; bookCodes=@($books.Values | Select-Object -Unique)
})

foreach ($edition in $editions) {
  $sourcePath = Join-Path $SourceDirectory $edition.file
  if (-not (Test-Path -LiteralPath $sourcePath)) { throw "Translation source not found: $sourcePath" }

  $archive = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path -LiteralPath $sourcePath))
  try {
    $documentEntry = $archive.GetEntry('word/document.xml')
    if (-not $documentEntry) { throw "word/document.xml not found in $($edition.file)" }
    $reader = [System.IO.StreamReader]::new($documentEntry.Open())
    try { [xml]$document = $reader.ReadToEnd() } finally { $reader.Dispose() }
  } finally { $archive.Dispose() }

  $namespaces = [System.Xml.XmlNamespaceManager]::new($document.NameTable)
  $namespaces.AddNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main')
  $records = [ordered]@{}
  $currentBook = $null
  $currentChapter = 0
  $currentVerse = 0

  foreach ($paragraph in $document.SelectNodes('//w:p', $namespaces)) {
    $paragraphText = (Get-NodeText $paragraph $namespaces).Trim()
    $header = [regex]::Match($paragraphText, $bookPattern)
    if ($header.Success) {
      $currentBook = $books[$header.Groups['book'].Value]
      $currentChapter = [int]$header.Groups['chapter'].Value
      $currentVerse = 0
      continue
    }
    if (-not $currentBook -or $currentChapter -lt 1 -or -not $paragraphText) { continue }

    $paragraphStyleNode = $paragraph.SelectSingleNode('./w:pPr/w:pStyle', $namespaces)
    $paragraphStyle = if ($paragraphStyleNode) { [string]$paragraphStyleNode.val } else { '' }
    $markerRuns = @($paragraph.SelectNodes('.//w:r[w:rPr/w:rStyle[@w:val="reftext1"]]', $namespaces))
    if ($markerRuns.Count -eq 0 -and ($excludedParagraphStyles -contains $paragraphStyle -or -not $paragraphStyle)) { continue }
    if ($paragraphText -eq 'Next:') { continue }

    foreach ($run in $paragraph.SelectNodes('.//w:r', $namespaces)) {
      $runText = Get-NodeText $run $namespaces
      if (-not $runText) { continue }
      $runStyleNode = $run.SelectSingleNode('./w:rPr/w:rStyle', $namespaces)
      $runStyle = if ($runStyleNode) { [string]$runStyleNode.val } else { '' }
      if ($runStyle -eq 'reftext1' -and $runText.Trim() -match '^\d+$') {
        $currentVerse = [int]$runText.Trim()
        $key = "$currentBook-$currentChapter-$currentVerse"
        if (-not $records.Contains($key)) {
          $records[$key] = [ordered]@{ bookCode=$currentBook; chapter=$currentChapter; verse=$currentVerse; text='' }
        }
        continue
      }
      if ($currentVerse -gt 0) {
        $key = "$currentBook-$currentChapter-$currentVerse"
        if ($records.Contains($key)) { $records[$key].text += $runText }
      }
    }
    if ($currentVerse -gt 0) {
      $key = "$currentBook-$currentChapter-$currentVerse"
      if ($records.Contains($key)) { $records[$key].text += ' ' }
    }
  }

  $verses = @($records.Values | ForEach-Object {
    [ordered]@{ bookCode=$_.bookCode; chapter=$_.chapter; verse=$_.verse; text=([regex]::Replace($_.text, '\s+', ' ').Trim()) }
  } | Where-Object { $_.text })
  $minimum = if ($edition.scope -eq 'Complete Bible') { 30000 } else { 7800 }
  if ($verses.Count -lt $minimum) { throw "$($edition.code) conversion yielded only $($verses.Count) verses" }

  $bookCodes = @($verses.bookCode | Select-Object -Unique)
  $packFile = "$($edition.code.ToLowerInvariant()).json.gz"
  $sourceHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $sourcePath).Hash
  $pack = [ordered]@{
    schemaVersion=1; code=$edition.code; abbreviation=$edition.abbreviation; name=$edition.name; scope=$edition.scope;
    rights=$edition.rights; sourceUrl=$edition.sourceUrl; sourceFile=$edition.file; sourceSha256=$sourceHash;
    bookCodes=$bookCodes; verseCount=$verses.Count; verses=$verses
  }
  Write-GzipJson $pack (Join-Path $OutputDirectory $packFile)
  $manifestEditions.Add([ordered]@{
    code=$edition.code; abbreviation=$edition.abbreviation; name=$edition.name; format='text'; scope=$edition.scope;
    rights=$edition.rights; sourceUrl=$edition.sourceUrl; packFile=$packFile; resourceFile=$null;
    verseCount=$verses.Count; bookCodes=$bookCodes
  })
  Write-Output "$($edition.code): $($verses.Count) verses across $($bookCodes.Count) books -> $packFile"
}

$manifestEditions.Add([ordered]@{
  code='GNV1560'; abbreviation='GNV 1560'; name='Geneva Bible 1560 Facsimile'; format='facsimile'; scope='Complete Bible facsimile';
  rights='Public domain historical facsimile. The supplied PDF is an image scan and is not represented as searchable verse text.';
  sourceUrl='https://commons.wikimedia.org/wiki/File:1560_Geneva_Bible.pdf'; packFile=$null;
  resourceFile='geneva_bible1560.pdf'; verseCount=0; bookCodes=@()
})

$manifest = [ordered]@{ schemaVersion=1; translations=@($manifestEditions) }
$manifestJson = $manifest | ConvertTo-Json -Depth 8
[System.IO.File]::WriteAllText((Join-Path $OutputDirectory 'manifest.json'), $manifestJson + [Environment]::NewLine, [System.Text.UTF8Encoding]::new($false))
Write-Output "Manifest: $(Join-Path $OutputDirectory 'manifest.json')"
