import {initializeApp, getApps, cert, AppOptions} from "firebase-admin/app";

const firebaseAdminConfig: AppOptions = {
  credential: cert({
    projectId: process.env.projectId,
    privateKey: process.env.PRIVATE_KEY?.replace(/\\n/g, "\n"),
    clientEmail: process.env.CLIENT_EMAIL
  }),
  databaseURL: process.env.DATABASE_URL,
  storageBucket: process.env.STORAGE_BUCKET
};

export function customInitApp() {
  if (getApps().length <= 0) {
    initializeApp(firebaseAdminConfig);
  }
}
