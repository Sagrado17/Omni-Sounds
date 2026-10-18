<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/9f8e4aba-34a2-472f-af9c-85811b162fe7

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


## Omni Sounds Firebase/authentication notes

- `firebase-applet-config.json` points to the `omni-sounds` Firebase project and its default Firestore database. This code change does not copy/import data from the previous project.
- Google login now uses Firebase `signInWithRedirect` and processes the return with `getRedirectResult`, which is more suitable for mobile browsers than a popup-only flow.
- The fake email/password login has been removed. Administrator access requires a real Firebase-authenticated, verified Google account whose email is explicitly allowed in `src/App.tsx` and `firestore.rules`.
- `firestore.rules` contains stricter validation for booking, purchase, and custom-beat requests. Rules in this ZIP are not automatically deployed by Vercel; publish them in Firebase Console > Firestore Database > Rules.
- In Firebase Console > Authentication > Settings > Authorized domains, add the exact production domain `omni-sounds.vercel.app` (and any other domain you actually use). In Authentication > Sign-in method, enable Google.
- After deploying the source to Vercel, test Google sign-in on the production URL. A source ZIP cannot confirm your Firebase console settings, Vercel deployment, OAuth consent configuration, or live database rules.

## Login Google em produção (proxy de /__/auth)

- `vercel.json` encaminha `/__/auth/*` e `/__/firebase/*` para `omni-sounds.firebaseapp.com`, e `src/firebase.ts` usa o domínio do próprio site como `authDomain` (em `localhost` mantém o domínio padrão do Firebase).
- Na Google Cloud Console do projeto `omni-sounds` > APIs e serviços > Credenciais > cliente OAuth Web (criado pelo Firebase): adicionar em **URIs de redirecionamento autorizados** `https://omni-sounds.vercel.app/__/auth/handler` e, em **Origens JavaScript autorizadas**, `https://omni-sounds.vercel.app`.
- O domínio também tem de estar em Firebase > Authentication > Settings > Authorized domains.
- O upload para o Drive tenta popup e, se o navegador o bloquear, usa redirecionamento.
