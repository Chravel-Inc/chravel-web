import {
  proxyUnfurlDestination,
  resolveUnfurlMiddlewareDecision,
} from './unfurl/middlewareHandler';

export const config = {
  matcher: ['/t/:path*', '/j/:path*', '/join/:path*'],
};

export default async function middleware(request: Request): Promise<Response | undefined> {
  const decision = resolveUnfurlMiddlewareDecision(
    new URL(request.url).pathname,
    request.headers.get('user-agent'),
  );

  if (decision.action === 'pass') {
    return undefined;
  }

  return proxyUnfurlDestination(decision.destination, request, request.headers.get('user-agent'));
}
