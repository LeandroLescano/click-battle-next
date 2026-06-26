const EMULATOR_HOST = process.env.RTDB_EMULATOR_HOST ?? "127.0.0.1";
const EMULATOR_PORT = Number(process.env.RTDB_EMULATOR_PORT ?? "9001");
const AUTH_EMULATOR_PORT = Number(process.env.AUTH_EMULATOR_PORT ?? "9098");
const PROJECT_ID = process.env.RTDB_PROJECT_ID ?? "click-battle-rules-check";
const DB_NAMESPACE = process.env.RTDB_NAMESPACE ?? `${PROJECT_ID}-default-rtdb`;

const TEST_ROOM_ID = "room-cleanup-rules-check";
const TEST_SESSION_ID = "session-check";

const hostLeasePath = `games/${TEST_ROOM_ID}/hostLease`;
const disconnectSignalPath = `roomHostDisconnects/${TEST_ROOM_ID}/${TEST_SESSION_ID}`;

const withTimeout = async (promise, label, ms = 10_000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);

  try {
    return await promise(controller.signal);
  } finally {
    clearTimeout(timeout);
  }
};

const buildDbUrl = (path, idToken) => {
  const url = new URL(`http://${EMULATOR_HOST}:${EMULATOR_PORT}/${path}.json`);
  url.searchParams.set("ns", DB_NAMESPACE);

  if (idToken) {
    url.searchParams.set("auth", idToken);
  }

  return url.toString();
};

const getAnonymousIdToken = async () => {
  const url = `http://${EMULATOR_HOST}:${AUTH_EMULATOR_PORT}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-api-key`;
  const response = await fetch(url, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({returnSecureToken: true})
  });

  if (!response.ok) {
    throw new Error(`auth-signup-failed:${response.status}`);
  }

  const payload = await response.json();

  if (typeof payload.idToken !== "string" || payload.idToken.length === 0) {
    throw new Error("auth-signup-missing-token");
  }

  return payload.idToken;
};

const attempt = async (label, method, path, idToken, body) => {
  try {
    const response = await withTimeout(
      (signal) =>
        fetch(buildDbUrl(path, idToken), {
          method,
          headers: body ? {"Content-Type": "application/json"} : undefined,
          body: body ? JSON.stringify(body) : undefined,
          signal
        }),
      label
    );

    return {
      label,
      allowed: response.ok,
      code: response.ok ? null : `${response.status}`
    };
  } catch (error) {
    return {
      label,
      allowed: false,
      code: error instanceof Error ? error.message : "unknown"
    };
  }
};

const verifyMode = async (idToken) => ({
  results: await Promise.all([
    attempt("read hostLease", "GET", hostLeasePath, idToken),
    attempt("write hostLease", "PUT", hostLeasePath, idToken, {
      ownerId: "owner-check",
      sessionId: TEST_SESSION_ID,
      claimedAt: Date.now(),
      lastRenewedAt: Date.now()
    }),
    attempt("delete hostLease", "DELETE", hostLeasePath, idToken),
    attempt("read disconnect signal", "GET", disconnectSignalPath, idToken),
    attempt("write disconnect signal", "PUT", disconnectSignalPath, idToken, {
      disconnectedAt: Date.now()
    }),
    attempt("delete disconnect signal", "DELETE", disconnectSignalPath, idToken)
  ])
});

const anonymousToken = await getAnonymousIdToken();
const unauthenticated = await verifyMode(null);
const authenticated = await verifyMode(anonymousToken);

console.log(
  JSON.stringify(
    {
      emulatorHost: EMULATOR_HOST,
      emulatorPort: EMULATOR_PORT,
      authEmulatorPort: AUTH_EMULATOR_PORT,
      projectId: PROJECT_ID,
      namespace: DB_NAMESPACE,
      unauthenticated,
      authenticated
    },
    null,
    2
  )
);

const unauthenticatedDenied = unauthenticated.results.every(
  (result) => !result.allowed
);
const authenticatedAllowed = authenticated.results.every(
  (result) => result.allowed
);

if (!unauthenticatedDenied || !authenticatedAllowed) {
  process.exitCode = 1;
}
