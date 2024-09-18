"use client";

import React, {useEffect} from "react";
import * as Sentry from "@sentry/nextjs";

export default function ErrorPage({error}: {error: Error & {digest?: string}}) {
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="d-flex flex-column align-items-center justify-content-center vh-100">
      <h2>Sorry, Something went wrong!</h2>
      <button
        className="btn-click small mt-3"
        onClick={() => (window.location.href = "/")}
      >
        Reload
      </button>
    </div>
  );
}
