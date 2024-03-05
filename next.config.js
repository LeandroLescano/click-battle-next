/* eslint-disable no-undef */
/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: false,
  images: {
    unoptimized: true
  },
  env: {
    apiKey: process.env.API_KEY,
    authDomain: process.env.AUTH_DOMAIN,
    databaseURL: process.env.DATABASE_URL,
    projectId: process.env.PROJECT_ID,
    storageBucket: process.env.STORAGE_BUCKET,
    messagingSenderId: process.env.MESSAGING_SENDER_ID,
    appId: process.env.APP_ID,
    measurementId: process.env.MEASUREMENT_ID,
    REACT_APP_EMAIL: process.env.REACT_APP_EMAIL,
    REACT_APP_PASSWORD: process.env.REACT_APP_PASSWORD,
    NEXT_PUBLIC_ROLLBAR_CLIENT_TOKEN:
      process.env.NEXT_PUBLIC_ROLLBAR_CLIENT_TOKEN,
    ROLLBAR_SERVER_TOKEN: process.env.ROLLBAR_SERVER_TOKEN
  }
};
