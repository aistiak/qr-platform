import { NextResponse } from 'next/server';

export function successResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function errorResponse(message: string, status: number = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function createdResponse<T>(data: T): NextResponse {
  return successResponse(data, 201);
}

export function notFoundResponse(message: string = 'Resource not found'): NextResponse {
  return errorResponse(message, 404);
}
