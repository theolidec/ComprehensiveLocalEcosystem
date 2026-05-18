# Third-Party Notices

This product (Comprehensive Local Ecosystem) is licensed under the MIT License
(see `LICENSE`). It incorporates and/or redistributes the following third-party
open-source software. The corresponding licenses and copyright notices are
reproduced or referenced below as required by each license.

This file lists the direct production dependencies declared in
`backend/package.json` and `frontend/package.json`. Transitive dependencies
inherit the same obligations and can be enumerated with:

```bash
# From the repo root
npx --yes license-checker --production --json --out third_party_licenses.json --start backend
npx --yes license-checker --production --json --out third_party_licenses.json --start frontend
```

A combined human-readable report can also be produced with:

```bash
npx --yes license-report --package=backend/package.json
npx --yes license-report --package=frontend/package.json
```

Compliance scope:

- **MIT / ISC / BSD-2-Clause / BSD-3-Clause**: only copyright/license-notice
  retention required — this file plus the package's own `LICENSE` shipped in
  `node_modules` satisfies that.
- **Apache-2.0**: §4(c)/(d) require retaining any `NOTICE` file from the
  upstream when redistributing — see the dedicated section below.
- **MPL-2.0**: file-level copyleft; modifications to MPL-licensed source files
  themselves must be released under MPL-2.0. We do not modify these files;
  we link to them as published.

No GPL / LGPL / AGPL dependencies are included in production builds.

---

## Backend dependencies

| Package | Version | License | Project |
|---|---|---|---|
| bcryptjs | ^3.0.3 | MIT | https://github.com/dcodeIO/bcrypt.js |
| cookie-parser | ^1.4.6 | MIT | https://github.com/expressjs/cookie-parser |
| cors | ^2.8.5 | MIT | https://github.com/expressjs/cors |
| dotenv | ^16.3.1 | BSD-2-Clause | https://github.com/motdotla/dotenv |
| express | ^4.18.2 | MIT | https://github.com/expressjs/express |
| express-rate-limit | ^7.1.5 | MIT | https://github.com/express-rate-limit/express-rate-limit |
| express-validator | ^7.3.1 | MIT | https://github.com/express-validator/express-validator |
| helmet | ^7.1.0 | MIT | https://github.com/helmetjs/helmet |
| jsonwebtoken | ^9.0.3 | MIT | https://github.com/auth0/node-jsonwebtoken |
| moment-timezone | ^0.6.1 | MIT | https://github.com/moment/moment-timezone |
| mongoose | ^8.6.1 | MIT | https://github.com/Automattic/mongoose |
| morgan | ^1.10.0 | MIT | https://github.com/expressjs/morgan |
| multer | ^2.1.1 | MIT | https://github.com/expressjs/multer |
| node-cron | ^4.2.1 | ISC | https://github.com/node-cron/node-cron |
| pdfkit | ^0.18.0 | MIT | https://github.com/foliojs/pdfkit |
| socket.io | ^4.8.3 | MIT | https://github.com/socketio/socket.io |
| socket.io-client | ^4.8.3 | MIT | https://github.com/socketio/socket.io |
| winston | ^3.15.0 | MIT | https://github.com/winstonjs/winston |

## Frontend dependencies

| Package | Version | License | Project |
|---|---|---|---|
| @tailwindcss/typography | ^0.5.19 | MIT | https://github.com/tailwindlabs/tailwindcss-typography |
| @tiptap/* (all extensions, pm, react, starter-kit) | ^3.23.1 | MIT | https://github.com/ueberdosis/tiptap |
| axios | ^1.13.6 | MIT | https://github.com/axios/axios |
| dompurify | ^3.4.2 | Apache-2.0 OR MPL-2.0 | https://github.com/cure53/DOMPurify |
| lucide-react | ^0.577.0 | ISC | https://github.com/lucide-icons/lucide |
| pdfjs-dist | ^5.7.284 | Apache-2.0 | https://github.com/mozilla/pdf.js |
| react | ^19.2.4 | MIT | https://github.com/facebook/react |
| react-dom | ^19.2.4 | MIT | https://github.com/facebook/react |
| react-markdown | ^10.1.0 | MIT | https://github.com/remarkjs/react-markdown |
| react-pdf | ^10.4.1 | MIT | https://github.com/wojtekmaj/react-pdf |
| react-router-dom | ^7.13.1 | MIT | https://github.com/remix-run/react-router |
| react-scripts | 5.0.1 | MIT | https://github.com/facebook/create-react-app |
| remark-gfm | ^4.0.1 | MIT | https://github.com/remarkjs/remark-gfm |
| socket.io-client | ^4.8.3 | MIT | https://github.com/socketio/socket.io |
| web-vitals | ^2.1.4 | Apache-2.0 | https://github.com/GoogleChrome/web-vitals |

## Other incorporated assets

| Asset | Author | Source | License |
|---|---|---|---|
| Folder-tree styling (`frontend/src/components/FileManager/FileTree.css`, derivative) | ashif_6672 | https://uiverse.io/ | CC BY 4.0 |
| Lucide icons (via `lucide-react`) | Lucide contributors | https://lucide.dev/ | ISC |

---

## Apache-2.0 NOTICE retention

Per Apache License 2.0 §4(d), if a redistributed Apache-2.0 work contains a
`NOTICE` text file, you must retain its content in any distribution. The
Apache-2.0 dependencies above ship with their `NOTICE` files in
`node_modules/<package>/NOTICE` (where present). For production builds that
do **not** ship `node_modules` (e.g., a bundled `frontend/build/`), reproduce
the relevant `NOTICE` contents in this section before public distribution.

### `pdfjs-dist` (Apache-2.0)

```
Copyright the PDF.js authors.
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    https://www.apache.org/licenses/LICENSE-2.0
```

### `web-vitals` (Apache-2.0)

```
Copyright Google LLC
Licensed under the Apache License, Version 2.0 (the "License");
```

### `dompurify` (Apache-2.0 OR MPL-2.0)

```
Copyright 2015–present Mario Heiderich (https://cure53.de/) and contributors.
Dual-licensed under either Apache License 2.0 or Mozilla Public License 2.0.
```

---

## CC BY 4.0 attribution (Uiverse derivative)

Per Creative Commons Attribution 4.0 International §3(a)(1), the following
notice satisfies the attribution requirement for the folder-tree CSS pattern
in `frontend/src/components/FileManager/FileTree.css`:

> Folder-tree styling adapted from a design by **ashif_6672**, originally
> published on Uiverse.io (https://uiverse.io/) under the Creative Commons
> Attribution 4.0 International License (CC BY 4.0). No endorsement implied.
> Full license text: https://creativecommons.org/licenses/by/4.0/

---

## Generating a complete (transitive) report

The table above lists direct dependencies only. To produce an exhaustive list
that includes every transitive dependency in a production install:

```bash
# Frontend (after `npm ci`):
npx --yes license-checker --production --start frontend --csv > frontend-licenses.csv

# Backend (after `npm ci`):
npx --yes license-checker --production --start backend --csv > backend-licenses.csv
```

Run this before any public/commercial release and append/replace the tables
above with the generated output.

---

_Last reviewed: 2026-05-14. Update whenever `package.json` dependencies change._
