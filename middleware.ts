import createMiddleware from "next-intl/middleware";
import { routing } from "./src/i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|_next|_vercel|fonts|images|favicon|icon.svg|robots.txt|sitemap.xml|sitemap-images|feed.xml).*)"],
};
