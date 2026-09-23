import { seed } from '@/db';
import { fail, ok } from '@/lib/api';

export const dynamic = 'force-dynamic';

// Usado pelos testes para restaurar a massa de dados. Só existe com ENABLE_TEST_ENDPOINTS=true.
export async function POST() {
  if (process.env.ENABLE_TEST_ENDPOINTS !== 'true') {
    return fail('NOT_FOUND', 'Not found.', 404);
  }
  seed();
  return ok({ reset: true });
}
