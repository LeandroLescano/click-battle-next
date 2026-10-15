import assert from "node:assert/strict";
import test from "node:test";
import ts from "typescript";
import {readFileSync} from "node:fs";

const loadTs = (path) => {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {module: ts.ModuleKind.CommonJS}
  }).outputText;
  const module = {exports: {}};
  new Function("module", "exports", output)(module, module.exports);
  return module.exports;
};

const config = loadTs("../../lib/seo/config.ts");

test("explicit share metadata targets the existing PNG endpoint", () => {
  assert.equal(config.DEFAULT_SHARE_IMAGE, "/opengraph-image.png");
});

for (const [host, environment, expected] of [
  ["sandbox.click-battle.com.ar", "preview", {allow: "/"}],
  ["dev.click-battle.com.ar", "preview", {allow: "/"}],
  ["unexpected.example.com", "production", {disallow: "/"}],
  ["www.click-battle.com.ar", "production", {allow: "/", disallow: "/admin"}]
]) {
  test(`robots policy for ${host} in ${environment}`, async () => {
    const source = readFileSync(
      new URL("../../app/robots.ts", import.meta.url),
      "utf8"
    );
    const output = ts.transpileModule(source, {
      compilerOptions: {module: ts.ModuleKind.CommonJS}
    }).outputText;
    const module = {exports: {}};
    const previous = process.env.VERCEL_ENV;
    process.env.VERCEL_ENV = environment;
    try {
      new Function("module", "exports", "require", output)(
        module,
        module.exports,
        (id) => {
          if (id === "next/headers")
            return {headers: async () => new Map([["host", host]])};
          if (id === "lib/seo/config") return config;
          throw new Error(`Unexpected import: ${id}`);
        }
      );
      const result = await module.exports.default();
      const rules = Array.isArray(result.rules)
        ? result.rules[0]
        : result.rules;
      assert.equal(rules.allow, expected.allow);
      assert.equal(rules.disallow, expected.disallow);
      assert.equal(Boolean(result.sitemap), host === "www.click-battle.com.ar");
    } finally {
      if (previous === undefined) delete process.env.VERCEL_ENV;
      else process.env.VERCEL_ENV = previous;
    }
  });
}
