import { request, type FullConfig } from '@playwright/test';

// Restaura a massa de dados uma vez antes da suíte.
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL;
  const context = await request.newContext({ baseURL });

  const response = await context.post('/api/test/reset');
  if (!response.ok()) {
    throw new Error(`Falha ao resetar a massa de dados: HTTP ${response.status()}`);
  }

  await context.dispose();
}
