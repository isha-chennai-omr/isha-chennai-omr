# OMR Link Preview Generator — React + Firebase

## Architecture

- React + Vite: generator UI
- Firebase Storage: uploaded poster images
- Cloud Firestore: unique slug + destination + image metadata
- Firebase Hosting: frontend and `/p/:slug` route
- Firebase Cloud Function: server-rendered Open Graph HTML for social crawlers

This server-rendered function is important: a normal React SPA cannot reliably provide `og:image` to WhatsApp crawlers because the metadata may only exist after JavaScript runs.

Firebase's current web SDK recommends the modular API. Cloud Storage supports browser uploads. See the official Firebase web setup and Storage docs.

## Setup

1. Create a Firebase project.
2. Register a Web App in Firebase.
3. Enable Firestore.
4. Enable Storage.
5. Enable Firebase Hosting.
6. Install Node.js 20+ and Firebase CLI.
7. Run:

   npm install
   cd functions && npm install && cd ..

8. Copy your Firebase Web App config into `src/firebase.js`.
9. Replace `YOUR_PROJECT_ID` in `.firebaserc`.
10. Deploy:

   npm run build
   firebase deploy

## Important security note

The included rules are intentionally simple for a single-purpose internal tool. For a public production generator, add Firebase Authentication and/or App Check and restrict who can create links.

## About uniqueness

The UI checks whether the slug exists before creation, but Firestore writes should also be made server-side or with a transaction/Cloud Function if you need strict protection against two users creating the same slug simultaneously.

## Suggested production improvement

Move link creation into a callable Cloud Function. The function should:
- validate the URL
- validate the slug
- verify the image metadata
- atomically reserve the slug
- return the generated URL

For an internal volunteer tool with a small number of users, the current version is a useful starting point.
