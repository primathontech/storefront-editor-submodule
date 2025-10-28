import React, { Suspense } from "react";
import { resolveStaticTemplate } from "@/registries/static-templates-registry";

interface Props {
  themeId: string;
  templateId: string;
}

export default function LazyTemplateLoader({ themeId, templateId }: Props) {
  const Component = resolveStaticTemplate(themeId, templateId);

  if (!Component) {
    return <div>Template not found</div>;
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Component />
    </Suspense>
  );
}
