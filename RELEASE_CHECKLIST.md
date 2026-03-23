# PosonDansla v1 Release Checklist

## 1) Supabase (required before deploy)
- Open Supabase SQL Editor.
- Run the latest [`supabase_tables.sql`](/home/daffy/Desktop/Dansala/supabase_tables.sql) file.
- Confirm `app_state` policies are `auth.uid() is not null` (not `true`).

## 2) Hosting (static app)
Use one of these:
- Vercel: import this folder as project, framework = `Other`, output = root.
- Netlify: drag-drop folder or connect repo, publish directory = root.
- GitHub Pages: publish this folder as static site.

Main file to host:
- [`index.html`](/home/daffy/Desktop/Dansala/index.html)

## 3) PWA install support
Required files already present:
- [`manifest.webmanifest`](/home/daffy/Desktop/Dansala/manifest.webmanifest)
- [`sw.js`](/home/daffy/Desktop/Dansala/sw.js)
- `icons/` directory

After deployment:
- Open app URL in Chrome/Edge/Android.
- Use "Install App" from browser prompt/menu.

## 4) Data retention test (must pass)
1. Open app URL on device A.
2. Login and add sample donation + expense.
3. Refresh page.
4. Login again and verify data remains.
5. Open app URL on device B.
6. Login and verify same data appears.

If data does not appear on device B:
- Check Supabase project URL/key in `index.html`.
- Check SQL policies were updated correctly.
- Check browser/network is not blocking Supabase.

## 5) Team handover notes
- Keep one source of truth: deployed URL.
- Do not edit credentials directly in browser storage.
- Backup monthly via Supabase table export.

## 6) Go/No-Go
Release only if all pass:
- [ ] SQL applied without errors
- [ ] Refresh persistence works on same device
- [ ] Cross-device sync works
- [ ] PWA install works on desktop and mobile
- [ ] Chairman/Treasurer/Main/Sub role visibility rules verified
