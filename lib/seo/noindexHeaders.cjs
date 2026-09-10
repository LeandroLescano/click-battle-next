/* global module */

const PREVIEW_ROBOTS_HEADERS = [
  {
    source: "/:path*",
    headers: [
      {
        key: "X-Robots-Tag",
        value: "noindex, nofollow, noarchive"
      }
    ]
  }
];

function getRobotsHeadersForVercelEnv(vercelEnv) {
  return vercelEnv === "preview" ? PREVIEW_ROBOTS_HEADERS : [];
}

module.exports = {getRobotsHeadersForVercelEnv};
