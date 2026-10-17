export const getRobotsPolicy = (
  host: string | null,
  vercelEnvironment: string | undefined,
  siteOrigin: string
) => {
  const publicHost = new URL(siteOrigin).host;

  if (host?.split(":")[0] !== publicHost) {
    return {
      rules: {
        userAgent: "*",
        // Preview responses carry X-Robots-Tag: noindex. Allow fetching it.
        ...(vercelEnvironment === "preview" ? {allow: "/"} : {disallow: "/"})
      }
    };
  }

  return {
    rules: [{userAgent: "*", allow: "/", disallow: "/admin"}],
    sitemap: new URL("/sitemap.xml", siteOrigin).toString()
  };
};
