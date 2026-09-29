/**
 * Server-rendered SPA shell.
 *
 * Returns the HTML document that boots the React client. Kept as a plain
 * template string (rather than JSX) so it can be edited without touching the
 * Hono JSX renderer, and so the client bundle stays the single source of UI.
 */

export function renderIndex(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Symptom Sorter — Clinical Decision Support</title>
  <meta name="description" content="Primary-care symptom-to-diagnosis decision support built on Hopcroft & Forte, Symptom Sorter 6th ed." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" />
  <link rel="stylesheet" href="/static/styles.css" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/static/app.js"></script>
</body>
</html>`
}
