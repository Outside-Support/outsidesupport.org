# Outside Support Contact Capture

This Apps Script turns the sitewide email form into a Google Sheet-backed capture flow with email alerts to `team@outsidesupport.org`.

## Deploy

1. Create a Google Sheet named `Outside Support Website Email Signups`.
2. Open the Sheet and choose `Extensions` -> `Apps Script`.
3. Replace `Code.gs` with the contents of `Code.gs` in this folder.
4. Add or replace `appsscript.json` with the manifest in this folder.
5. Run `setupSubmissionsSheet` once and approve the requested permissions.
6. Run `testAlertEmail` once and confirm `team@outsidesupport.org` receives the test alert.
7. Deploy as a web app:
   - Execute as: `Me`
   - Who has access: `Anyone`
8. Copy the deployed web app URL into `contact-config.js` as `endpoint`.

After deployment, each submission appends a row to the `Submissions` sheet and sends an alert to `team@outsidesupport.org`.

If you edit the script after deploying it, use `Deploy` -> `Manage deployments` -> edit the web app deployment -> choose `New version` -> `Deploy`. Existing web app URLs keep using the old code until you deploy a new version.
