# V23 admin browser certification

Status: NOT_VERIFIED.

The local Next dev server compiled `/register` and `/sell` and returned HTTP 200. The browser then showed:

`TypeError: Cannot read properties of undefined (reading 'call')`

The stack is `options.factory` inside the Next webpack client runtime, during `mountLazyComponent`. Reloading `/register` after compilation did not clear it. `/sell` hit the same error. These pages were not changed in V23.

The Admin Center was not opened as a rendered page. Authenticated API calls against `/api/admin/*` did succeed and are recorded in the authorization report. An API response is not a browser certification of navigation, search, filters, or mobile layout.

The Vercel preview remains behind Vercel Authentication. No protection exception was added. No production account was used.
