import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "../lib/auth-context";
import { CartProvider } from "../lib/cart-context";
import { supabase } from "@/integrations/supabase/client";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="eyebrow mb-6">404</p>
        <h1 className="text-5xl">Page not found</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center justify-center rounded-sm bg-primary px-6 py-3 text-sm font-medium uppercase tracking-widest text-primary-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Return home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-3xl">Something went wrong</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Please try again or return home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-sm bg-primary px-5 py-2.5 text-xs font-medium uppercase tracking-widest text-primary-foreground hover:bg-accent hover:text-accent-foreground"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-sm border border-input bg-background px-5 py-2.5 text-xs font-medium uppercase tracking-widest text-foreground hover:bg-secondary"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
       { title: "Patience Sewing Ltd — Premium African Fashion, Wholesale" },
      {
        name: "description",
        content:
          "Wholesale luxury African fashion crafted with intention. Minimum 12 pieces. Trusted by 500+ retailers.",
      },
       { name: "author", content: "Patience Sewing Ltd" },
       { property: "og:title", content: "Patience Sewing Ltd — Premium African Fashion, Wholesale" },
       { property: "og:description", content: "Patience Sewing Ltd offers retail and wholesale African fashion from Bayelsa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
       { name: "twitter:description", content: "Patience Sewing Ltd offers retail and wholesale African fashion from Bayelsa." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <Outlet />
          <Toaster position="top-center" theme="light" />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
