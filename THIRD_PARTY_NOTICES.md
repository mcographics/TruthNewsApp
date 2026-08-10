# Third-party content and software notices

TruthNewsApp keeps publisher attribution visible and does not present a publisher's reporting as original TruthNewsApp reporting. The application stores headline, summary, category, publication time, canonical link, and related feed metadata for local browsing. Opening the original article launches the publisher's HTTPS page in the default browser.

## World English Bible, Protestant edition

The bundled offline Bible text is the World English Bible, Protestant edition (`engwebp`), obtained from eBible.org. The Bible text is public domain. "World English Bible" is a trademark of eBible.org and Rainbow Missions, Inc.; TruthNewsApp is not affiliated with or endorsed by them. The unaltered source text and its accompanying about file are packaged with the application.

Source: https://ebible.org/details.php?id=engwebp

## Additional offline Bible editions

The local Scripture library also contains verse-addressable data converted from the documents supplied in `bible-translations/Free`. The conversion reads the DOCX verse-number run styles, excludes document navigation and section headings, preserves the supplied verse wording, and stores each edition as a compressed, lazily imported local data pack.

- American King James Version (AKJV): the producer permits copying, sale, and modification, while prohibiting false authorship claims or a new exclusive copyright claim.
- American Standard Version (ASV), Darby Bible Translation (DBT), Douay-Rheims Bible (DRB), English Revised Version (ERV), King James Version (KJV), Smith's Literal Translation (SLT), Webster's Bible Translation (WBT), and Young's Literal Translation (YLT): historical public-domain editions. The KJV can remain subject to Crown rights in the United Kingdom.
- JPS Tanakh 1917 / Weymouth New Testament: a combined source document containing historical public-domain editions.
- Berean Interlinear Bible (BIB) and Berean Literal Bible (BLB): the supplied 2016 documents retain their original notice, but the Berean Bible project officially placed its Bible texts into the public domain on April 30, 2023.

Source downloads: https://biblehub.com/downloads.htm
Berean licensing declaration: https://berean.bible/licensing.htm

The Geneva Bible 1560 resource is the supplied 1,224-page historical image facsimile. It is exposed as a facsimile, not represented as OCR-derived or searchable verse text. The original work and the identified scan are marked public domain on the source description.

Facsimile source description: https://commons.wikimedia.org/wiki/File:1560_Geneva_Bible.pdf

## EB Garamond Initials

The decorative initial font is EB Garamond Initials by Georg Duffner and contributors. It is distributed under the SIL Open Font License 1.1. The upstream source and complete license are retained in `EB-Garamond-Initials/`, and the license is included with packaged builds.

Source: https://github.com/georgd/EB-Garamond-Initials

## News feeds

News items remain attributed to their publishers. Initial enabled feeds are drawn from publisher-provided RSS endpoints, including The Christian Post, The Jerusalem Post, and Fox News. Feed synchronization can be disabled per source in Settings > Sources. Availability and publisher terms may change; the source registry records the feed URL and rights note for review.

## Open-source packages

The application also uses Electron, React, Vite, sql.js, rss-parser, Lucide, and supporting open-source packages under their respective licenses. Package names and resolved versions are recorded in `package-lock.json`.
