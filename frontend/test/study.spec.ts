import { test, expect, type Page } from '@playwright/test';

const studyDoc = {
  id: 1,
  filename: 'biology.pdf',
  title: 'Plant biology',
  extracted_text: 'Photosynthesis turns sunlight into chemical energy.',
  created_at: '2026-09-26T00:00:00Z',
};
async function mockApi(page: Page, initial = false) {
  let documents = initial ? [{ ...studyDoc }] : [];
  let summary: object | null = null;
  await page.route('**/api/documents**', async (route) => {
    const url = new URL(route.request().url());
    const method = route.request().method();
    const path = url.pathname;
    const respond = (body: unknown, status = 200) =>
      route.fulfill({ json: body, status });
    if (path.endsWith('/summary')) {
      if (method === 'POST')
        summary = {
          id: 1,
          documentId: 1,
          summary:
            '## Key ideas\n\nPlants turn **sunlight** into chemical energy.',
          createdAt: studyDoc.created_at,
        };
      return summary
        ? respond(summary, method === 'POST' ? 201 : 200)
        : respond({ message: 'Summary not found' }, 404);
    }
    if (path.endsWith('/questions'))
      return respond({
        questions: {
          multiple_choice: Array.from({ length: 5 }, (_, index) => ({
            question: `What powers photosynthesis? Question ${index + 1}`,
            choices: ['A. Sunlight', 'B. Rocks', 'C. Metal', 'D. Sand'],
            answer: 'A',
          })),
          enumeration: Array.from({ length: 5 }, (_, index) => ({
            question: `Enumerate a photosynthesis component ${index + 1}.`,
            answer: ['Sunlight'],
          })),
          explanation: Array.from({ length: 5 }, (_, index) => ({
            question: `Explain photosynthesis ${index + 1}.`,
            answer: 'Plants use sunlight to make energy.',
          })),
        },
      });
    if (path.endsWith('/chat'))
      return respond({
        documentId: 1,
        answer: 'Sunlight provides the energy. [Chunk 1]',
        mode: 'rag',
        sources: [
          {
            id: 1,
            chunk_index: 0,
            content: studyDoc.extracted_text,
            similarity: 1,
          },
        ],
      });
    if (path === '/api/documents') {
      if (method === 'POST') {
        documents.push({ ...studyDoc });
        return respond(studyDoc, 201);
      }
      return respond({ documents, limit: 20, offset: 0 });
    }
    if (method === 'PATCH') {
      documents[0] = {
        ...documents[0],
        title: route.request().postDataJSON().title,
      };
      return respond(documents[0]);
    }
    if (method === 'DELETE') {
      documents = [];
      return route.fulfill({ status: 204 });
    }
    return respond(documents[0] || studyDoc);
  });
}

test('empty library is responsive, and upload through summary, practice, chat, rename and delete works', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await mockApi(page);
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Your study space.' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'A fresh page for your ideas.' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath('library.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Upload PDF', exact: true }).click();
  await page
    .getByLabel('Choose PDF')
    .setInputFiles({
      name: 'biology.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-test fixture'),
    });
  await page.getByLabel('Document title').fill('Plant biology');
  await page
    .getByRole('button', { name: 'Upload document', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Plant biology', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Generate summary', exact: true })
    .click();
  await expect(page.getByRole('heading', { name: 'Key ideas' })).toBeVisible();
  await page.getByRole('button', { name: 'Practice', exact: true }).click();
  await page
    .getByRole('button', { name: 'Generate questions', exact: true })
    .click();
  await page.getByRole('radio').first().check();
  await page
    .getByRole('button', { name: 'Check answers', exact: true })
    .click();
  await expect(page.getByText('1 of 5', { exact: true })).toBeVisible();
  await page
    .getByRole('button', { name: 'Ask a question', exact: true })
    .click();
  await page.getByLabel('Your question').fill('What powers photosynthesis?');
  await page
    .getByRole('button', { name: 'Send question', exact: true })
    .click();
  await expect(
    page.getByText('Sunlight provides the energy. [Chunk 1]', { exact: true }),
  ).toBeVisible();
  await page.getByText('1 source passage', { exact: true }).click();
  await expect(
    page.getByText(studyDoc.extracted_text, { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('chat.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Source text', exact: true }).click();
  await expect(
    page.getByText(studyDoc.extracted_text, { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Rename document', exact: true })
    .click();
  await page.getByLabel('Document title').fill('Biology review');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Biology review', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Delete document', exact: true })
    .click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Delete document', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'A fresh page for your ideas.' }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test('API failures are recoverable and a failed chat preserves the question', async ({
  page,
}) => {
  await mockApi(page, true);
  let fail = true;
  await page.route('**/api/documents?*', async (route) =>
    fail
      ? route.fulfill({
          status: 503,
          json: { message: 'Study space unavailable' },
        })
      : route.fallback(),
  );
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText(
    'Study space unavailable',
  );
  fail = false;
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await page.getByRole('button', { name: /Plant biology biology.pdf/ }).click();
  await page
    .getByRole('button', { name: 'Ask a question', exact: true })
    .click();
  await page.route('**/api/documents/1/chat', (route) =>
    route.fulfill({
      status: 502,
      json: { message: 'AI temporarily unavailable' },
    }),
  );
  await page.getByLabel('Your question').fill('Explain photosynthesis');
  await page
    .getByRole('button', { name: 'Send question', exact: true })
    .click();
  await expect(page.getByRole('alert')).toContainText(
    'AI temporarily unavailable',
  );
  await expect(page.getByLabel('Your question')).toHaveValue(
    'Explain photosynthesis',
  );
});

test('search, guide, and upload dialog keyboard dismissal work', async ({
  page,
}) => {
  await mockApi(page, true);
  await page.goto('/');
  await page.getByLabel('Search loaded documents').fill('unmatched');
  await expect(
    page.getByRole('heading', { name: 'No matching documents' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Clear search' }).click();
  await expect(
    page.getByRole('button', { name: /Plant biology biology.pdf/ }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Study guide' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Upload PDF', exact: true }).click();
  await page
    .getByLabel('Choose PDF')
    .setInputFiles({
      name: 'notes.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('notes'),
    });
  await expect(page.getByRole('alert')).toContainText('Choose one PDF');
  await expect(
    page.getByRole('button', { name: 'Upload document', exact: true }),
  ).toBeDisabled();
});
