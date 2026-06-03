# Gartentagebuch PWA v5

## Neu in v5

- Backup exportieren als JSON-Datei
- Backup importieren aus JSON-Datei
- Damit kannst du deine Daten vom Handy sichern oder später auf Laptop/anderes Gerät übertragen.
- CSV-Export bleibt für Tabellen/Excel erhalten.

## Wichtig

- CSV = gut zum Anschauen in Excel/Sheets
- Backup JSON = wichtig zum Wiederherstellen der App-Daten

## Starten lokal

1. Ordner in VS Code öffnen.
2. Rechtsklick auf `index.html`.
3. `Open with Live Server`.

## Beim Wechsel von älteren Versionen

Wenn du noch alte Daten siehst:
1. DevTools öffnen.
2. Application/Anwendung → Service Worker → Unregister.
3. Storage → Clear site data.
4. Neu öffnen.
