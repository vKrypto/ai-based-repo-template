import { useEffect, useState, type ReactElement } from "react";
import { fetchJson } from "../lib/apiClient.js";

interface StaticPageContent {
  slug: string;
  title: string;
  contentHtml: string;
  updatedAt: string;
}

interface StaticPageProps {
  slug: string;
}

export function StaticPage({ slug }: StaticPageProps): ReactElement {
  const [page, setPage] = useState<StaticPageContent | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setPage(null);
    setHasError(false);
    fetchJson<StaticPageContent>(`/api/pages/${slug}`)
      .then(setPage)
      .catch(() => setHasError(true));
  }, [slug]);

  if (hasError) {
    return <p>This page could not be loaded.</p>;
  }

  if (!page) {
    return <p>Loading…</p>;
  }

  return (
    <article>
      <h1>{page.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: page.contentHtml }} />
    </article>
  );
}
