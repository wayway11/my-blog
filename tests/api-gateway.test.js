import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getToken, verifyToken, giteeHeaders } from '../functions/api/index.js';

// ── Task 1: Token ──

test('getToken extracts Bearer token from Authorization header', () => {
  const req = {
    headers: new Map([
      ['Authorization', 'Bearer abc123token']
    ])
  };
  assert.equal(getToken(req), 'abc123token');
});

test('getToken returns empty string when no Authorization header', () => {
  const req = { headers: new Map() };
  assert.equal(getToken(req), '');
});

test('getToken handles non-Bearer auth gracefully', () => {
  const req = {
    headers: new Map([
      ['Authorization', 'Basic dXNlcjpwYXNz']
    ])
  };
  assert.equal(getToken(req), 'Basic dXNlcjpwYXNz');
});
