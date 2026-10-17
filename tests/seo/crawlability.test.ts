import assert from "node:assert/strict";
import test from "node:test";

import {DEFAULT_SHARE_IMAGE, SITE_ORIGIN} from "../../lib/seo/config.ts";
import {getRobotsPolicy} from "../../lib/seo/robotsPolicy.ts";

test("explicit share metadata targets the existing PNG endpoint", () => {
  assert.equal(DEFAULT_SHARE_IMAGE, "/opengraph-image.png");
});

const cases: Array<{
  host: string | null;
  environment: string | undefined;
  allow?: string;
  disallow?: string;
  sitemap: boolean;
}> = [
  {
    host: "sandbox.click-battle.com.ar",
    environment: "preview",
    allow: "/",
    sitemap: false
  },
  {
    host: "dev.click-battle.com.ar",
    environment: "preview",
    allow: "/",
    sitemap: false
  },
  {
    host: "unexpected.example.com",
    environment: "production",
    disallow: "/",
    sitemap: false
  },
  {host: null, environment: undefined, disallow: "/", sitemap: false},
  {
    host: "www.click-battle.com.ar",
    environment: "production",
    allow: "/",
    disallow: "/admin",
    sitemap: true
  }
];

for (const scenario of cases) {
  test(`robots policy for ${scenario.host} in ${scenario.environment}`, () => {
    const result = getRobotsPolicy(
      scenario.host,
      scenario.environment,
      SITE_ORIGIN
    );
    const rules = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    assert.equal("allow" in rules ? rules.allow : undefined, scenario.allow);
    assert.equal(
      "disallow" in rules ? rules.disallow : undefined,
      scenario.disallow
    );
    assert.equal(Boolean(result.sitemap), scenario.sitemap);
  });
}
