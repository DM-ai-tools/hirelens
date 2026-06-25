const base = "http://localhost:3001";

function parseCookies(setCookieHeaders) {
  const jar = new Map();
  for (const header of setCookieHeaders) {
    const [pair] = header.split(";");
    const eq = pair.indexOf("=");
    if (eq === -1) continue;
    jar.set(pair.slice(0, eq), pair.slice(eq + 1));
  }
  return jar;
}

function cookieHeader(jar) {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

const csrfRes = await fetch(`${base}/api/auth/csrf`);
const jar = parseCookies(csrfRes.headers.getSetCookie?.() ?? []);
const { csrfToken } = await csrfRes.json();

const body = new URLSearchParams({
  csrfToken,
  email: process.argv[2] ?? "recruiter@dotmappers.in",
  password: process.argv[3] ?? "recruiter123",
  rememberMe: "false",
  callbackUrl: `${base}/`,
  json: "true",
});

const loginRes = await fetch(`${base}/api/auth/callback/credentials`, {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    Cookie: cookieHeader(jar),
  },
  body,
  redirect: "manual",
});

for (const c of loginRes.headers.getSetCookie?.() ?? []) {
  const [pair] = c.split(";");
  const eq = pair.indexOf("=");
  if (eq !== -1) jar.set(pair.slice(0, eq), pair.slice(eq + 1));
}

console.log("Login status:", loginRes.status);
console.log("Location:", loginRes.headers.get("location"));

const sessionRes = await fetch(`${base}/api/auth/session`, {
  headers: { Cookie: cookieHeader(jar) },
});
console.log("Session:", await sessionRes.json());
