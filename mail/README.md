# CupMail frontend

Static frontend for GitHub Pages. The backend runs separately on Cloudflare Workers.

## Files

- `index.html` — public website.

## Configure the Worker URL

The `index.html` must have correct worker url:


```js
const API_BASE = "https://tm.hqfm.workers.dev";
```

Do not add a trailing slash.

## Expected Worker API

The frontend expects these endpoints:

| Method | Endpoint | Expected response |
|---|---|---|
| GET | `/domains` | Mail.tm domain collection (`hydra:member`) or `{ "domains": [] }` |
| POST | `/start` | `{ "address": "user@domain", "token": "...", "mode": "created" }` |
| GET | `/messages` | Mail.tm message collection (`hydra:member`) or `{ "messages": [] }` |
| GET | `/messages/{id}` | One Mail.tm message object |

`POST /start` accepts JSON:

```json
{ "username": "temp001", "domain": "example.com" }
```

The Worker should try creating the account with the agreed shared password `Temp001#`, then attempt login whether creation succeeded or the account already existed. Return the Mail.tm token to the browser. If login fails, return an appropriate 4xx JSON error.

The Worker must allow CORS requests from the exact GitHub Pages origin where this frontend is hosted, and handle `OPTIONS` preflight requests.

## Behaviour

- The Mail.tm token is kept only in the active browser tab's JavaScript memory.
- No frontend database, localStorage, sessionStorage, or KV is used.
- The browser polls the inbox every five seconds while the page remains open.
- Closing/reloading the tab stops polling and loses the in-memory token.
- Mail.tm may still receive and retain messages independently of the page being open.
- The same address is a shared public inbox. Anyone who knows the address can sign in using the shared password and read its messages. Do not use it for sensitive accounts.
