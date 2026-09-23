import { NextResponse } from 'next/server';
import { ServiceError } from './errors';

export interface ApiError {
  error: { code: string; message: string };
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(code: string, message: string, status: number) {
  return NextResponse.json<ApiError>({ error: { code, message } }, { status });
}

export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

// Converte ServiceError em resposta JSON de erro.
export async function handle(fn: () => Response | Promise<Response>) {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof ServiceError) {
      return fail(error.code, error.message, error.status);
    }
    throw error;
  }
}
