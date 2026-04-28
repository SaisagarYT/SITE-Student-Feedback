# CI Deploy (GitHub Actions) — Firebase Hosting

Use this workflow to build and deploy the site from GitHub Actions so you don't need to deploy from a local machine.

1. Generate a Firebase CI token on a machine that can access Firebase CLI:

```bash
npm i -g firebase-tools
firebase login:ci
```

Copy the token printed by the command.

2. Add the token to your repository secrets:
- Go to your GitHub repo → Settings → Secrets → Actions → New repository secret
- Name: `FIREBASE_TOKEN`
- Value: the token from step 1

3. Push to `main` or run the workflow manually (Actions → Build and Deploy to Firebase Hosting → Run workflow).

Notes:
- The workflow uses the `hosting` target named `sasi` defined in your `.firebaserc`.
- If you prefer a service account, you can instead set up a GCP service account and use GOOGLE_APPLICATION_CREDENTIALS, but `FIREBASE_TOKEN` is the simplest approach for CI.
