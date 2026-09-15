import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|_next|_vercel|fonts|images|favicon|icon.svg|logo.svg|logo-inline.svg|llms.txt|robots.txt|sitemap.xml|sitemap-images|feed.xml|rapoarte).*)"],
};
