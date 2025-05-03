import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const redirectedFrom = url.searchParams.get('redirectedFrom');
  
  const redirectUrl = new URL('/admin/login', url.origin);
  if (redirectedFrom) {
    redirectUrl.searchParams.set('redirectedFrom', redirectedFrom);
  }
  
  return NextResponse.redirect(redirectUrl);
} 