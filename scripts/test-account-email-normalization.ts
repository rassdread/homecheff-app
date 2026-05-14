import assert from "node:assert/strict";
import { tryNormalizeEmail } from "../lib/auth/normalize-email";

assert.equal(tryNormalizeEmail(" Test@Example.COM "), "test@example.com");
assert.equal(tryNormalizeEmail("bad"), null);
assert.equal(tryNormalizeEmail(""), null);

console.log("test-account-email-normalization: ok");
