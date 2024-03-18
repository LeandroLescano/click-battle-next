"use client";

import React, {useEffect} from "react";
import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";

export default function GlobalError({
  error
}: {
  error: Error & {digest?: string};
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        {/* This is the default Next.js error component but it doesn't allow omitting the statusCode property yet. */}
        <NextError statusCode={undefined as never} />
      </body>
    </html>
  );
}
