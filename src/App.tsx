import { useState } from "react";
import { NavProvider, type Page } from "@/nav";
import { Shell } from "@/components/shell";
import { RadarView } from "@/components/radar-view";
import { SourcesView } from "@/components/sources-view";
import { BudgetsView } from "@/components/budgets-view";

export function App() {
  const [page, setPage] = useState<Page>("/");
  return (
    <NavProvider page={page} go={setPage}>
      <Shell>
        {page === "/" && <RadarView />}
        {page === "/sources" && <SourcesView />}
        {page === "/budgets" && <BudgetsView />}
      </Shell>
    </NavProvider>
  );
}
