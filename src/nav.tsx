import { createContext, useContext, type ReactNode } from "react";

export type Page = "/" | "/sources" | "/budgets";

const Ctx = createContext<{ page: Page; go: (p: Page) => void }>({
  page: "/",
  go: () => {},
});

export function NavProvider({
  page,
  go,
  children,
}: {
  page: Page;
  go: (p: Page) => void;
  children: ReactNode;
}) {
  return <Ctx.Provider value={{ page, go }}>{children}</Ctx.Provider>;
}

export function usePage() {
  return useContext(Ctx).page;
}

export function Link({
  to,
  className,
  children,
}: {
  to: Page;
  className?: string;
  children: ReactNode;
}) {
  const { go } = useContext(Ctx);
  return (
    <button type="button" className={className} onClick={() => go(to)}>
      {children}
    </button>
  );
}
