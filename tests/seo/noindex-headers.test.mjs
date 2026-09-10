import assert from "node:assert/strict";
import test from "node:test";

import {getRobotsHeadersForVercelEnv} from "../../lib/seo/noindexHeaders.cjs";

test("marks every Vercel preview deployment as noindex", () => {
  assert.deepEqual(getRobotsHeadersForVercelEnv("preview"), [
    {
      source: "/:path*",
      headers: [
        {
          key: "X-Robots-Tag",
          value: "noindex, nofollow, noarchive"
        }
      ]
    }
  ]);
});

test("does not add noindex headers to production deployments", () => {
  assert.deepEqual(getRobotsHeadersForVercelEnv("production"), []);
});

test("does not add noindex headers outside Vercel preview", () => {
  assert.deepEqual(getRobotsHeadersForVercelEnv(undefined), []);
});
