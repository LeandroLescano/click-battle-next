"use client";

import React, {useEffect} from "react";
import * as Sentry from "@sentry/nextjs";

import {Button} from "components-new";

export default function ErrorPage({error}: {error: Error & {digest?: string}}) {
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-dvh">
      <h2 className="text-4xl text-primary-200 dark:text-primary-100 font-bold">
        Sorry, Something went wrong!
      </h2>
      <div className="flex gap-4">
        <Button className="p-2 mt-3" onClick={() => window.location.reload()}>
          Reload
        </Button>
        <Button
          className="p-2 mt-3"
          onClick={() => (window.location.href = "/")}
        >
          Back to home
        </Button>
      </div>
    </div>
  );
}
