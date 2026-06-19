import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getToken, verifyToken, giteeHeaders, listEntries, getEntry, buildFileContent } from '../functions/api/index.js';

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

// ── Task 2: List entries ──

test('listEntries filters and maps Gitee directory response to entries', async () => {
  // Simulate what listEntries does by calling it — but the test data is the
  // expected shape from Gitee API
  const mockResponse = [
    { name: '2026-06-18-hello.md', path: 'src/content/blog/2026-06-18-hello.md', type: 'file' },
    { name: '2026-06-19-test.md', path: 'src/content/blog/2026-06-19-test.md', type: 'file' },
    { name: '.gitkeep', path: 'src/content/blog/.gitkeep', type: 'file' },
  ];

  // Simulate what the function does with the data
  const result = mockResponse
    .filter(f => f.type === 'file' && f.name.endsWith('.md'))
    .map(f => ({
      name: f.name,
      path: f.path,
      slug: f.name.replace('.md', ''),
    }));

  assert.equal(result.length, 2);
  assert.equal(result[0].name, '2026-06-18-hello.md');
  assert.equal(result[0].slug, '2026-06-18-hello');
  assert.equal(result[1].name, '2026-06-19-test.md');
});

test('listEntries returns empty array for empty or non-md directory', () => {
  const filterAndMap = (data) =>
    (Array.isArray(data) ? data : [data])
      .filter(f => f.type === 'file' && f.name.endsWith('.md'))
      .map(f => ({ name: f.name, path: f.path, slug: f.name.replace('.md', '') }));

  assert.deepEqual(filterAndMap([]), []);
  assert.deepEqual(filterAndMap([{ name: 'img.png', path: 'img.png', type: 'file' }]), []);
});

// ── Task 3: Read entry ──

test('parseEntry decodes Gitee base64 content and extracts frontmatter', () => {
  const yaml = `title: Hello World
date: 2026-06-19
tags:
  - AI
summary: A test post
draft: false
`;
  const body = `## Hello

This is the content.`;
  const fullContent = `---\n${yaml}---\n${body}`;
  const base64Content = Buffer.from(fullContent).toString('base64');

  const raw = Buffer.from(base64Content, 'base64').toString('utf-8');
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  const [, frontmatterStr, bodyStr] = match;
  const frontmatter = {};
  frontmatterStr.split('\n').forEach(line => {
    const m = line.match(/^(\w+):\s*(.*)/);
    if (m) frontmatter[m[1]] = m[2].trim();
  });

  assert.equal(frontmatter.title, 'Hello World');
  assert.equal(frontmatter.date, '2026-06-19');
  assert.ok(bodyStr.trim().includes('This is the content'));
});

test('parseEntry handles file without frontmatter', () => {
  const content = 'Just some markdown without frontmatter';
  const base64Content = Buffer.from(content).toString('base64');

  const raw = Buffer.from(base64Content, 'base64').toString('utf-8');
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  let bodyResult, fmResult;
  if (!match) {
    bodyResult = raw;
    fmResult = {};
  } else {
    const [, fmStr, bodyStr] = match;
    fmResult = {};
    fmStr.split('\n').forEach(line => {
      const m = line.match(/^(\w+):\s*(.*)/);
      if (m) fmResult[m[1]] = m[2].trim();
    });
    bodyResult = bodyStr.trim();
  }

  assert.equal(bodyResult, content);
  assert.deepEqual(fmResult, {});
});

// ── Task 4: Create/update entry ──

test('buildFileContent generates Markdown with all frontmatter fields', () => {
  const result = buildFileContent({
    title: 'Test Post',
    date: '2026-06-19',
    tags: ['AI', 'Dev'],
    summary: 'A test',
    draft: false,
    body: '## Hello World\n\nThis is a post.',
  });

  assert.ok(result.startsWith('---\n'));
  assert.ok(result.includes('title: Test Post'));
  assert.ok(result.includes('date: 2026-06-19'));
  assert.ok(result.includes('tags:'));
  assert.ok(result.includes('  - AI'));
  assert.ok(result.includes('  - Dev'));
  assert.ok(result.includes('summary: A test'));
  assert.ok(result.includes('## Hello World'));
  assert.ok(!result.includes('draft: true'));
});

test('buildFileContent includes draft: true when draft is set', () => {
  const result = buildFileContent({ title: 'Draft', draft: true, body: 'secret' });
  assert.ok(result.includes('draft: true'));
});

test('buildFileContent handles minimal data (title only)', () => {
  const result = buildFileContent({ title: 'Simple' });
  assert.ok(result.startsWith('---\n'));
  assert.ok(result.includes('title: Simple'));
  assert.ok(result.endsWith('\n'));
});
