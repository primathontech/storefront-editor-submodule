"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { api } from "../services/api";
import { useEditorState } from "../stores/useEditorState";
import { EditorHeaderShimmer } from "../components/ui/EditorHeaderShimmer";
import { EditorContentShimmer } from "../components/ui/EditorContentShimmer";
import { RightSidebarWidthProvider } from "../context/RightSidebarWidthContext";

const EditorHeader2 = dynamic(() => import("../components/ui/EditorHeader2"), {
  ssr: false,
  loading: () => <EditorHeaderShimmer />,
});

const TemplateEditor = dynamic(
  () => import("../components/containers/TemplateEditor"),
  {
    ssr: false,
    loading: () => <EditorContentShimmer />,
  }
);

const TranslationEditor = dynamic(
  () => import("../components/containers/TranslationEditor"),
  {
    ssr: false,
    loading: () => <EditorContentShimmer />,
  }
);

export default function UnifiedEditorPage() {
  const params = useParams();
  const {
    setPageConfig,
    setPendingPageConfig,
    setPageData,
    setPageDataStale,
    setSelectedSection,
    setSelectedWidget,
    setShowSettingsDrawer,
  } = useEditorState.getState();

  const [authState, setAuthState] = useState<{
    isValid: boolean | null;
    themeId?: string;
    error?: string;
  }>({ isValid: null });
  const [theme, setTheme] = useState<any>(null);
  const [templateMeta, setTemplateMeta] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const validateAuth = async () => {
      try {
        const result = await api.editor.validateMerchantAuth(
          params.id as string
        );
        setAuthState(result);
      } catch (error) {
        console.error("Auth validation error:", error);
        setAuthState({ isValid: false, error: "Failed to validate auth" });
      }
    };
    validateAuth();
  }, [params.id]);

  useEffect(() => {
    if (!authState.themeId) {
      return;
    }

    const loadData = async () => {
      try {
        const theme = await api.editor.getTheme(authState.themeId!);
        setTheme(theme);
        const homeTemplate = findHomeTemplate(theme);
        if (homeTemplate) {
          setTemplateMeta(homeTemplate);
        }
      } catch (error) {
        console.error("Failed to load theme:", error);
      }
    };
    loadData();
  }, [authState.themeId]);

  // Show loading while initializing
  if (authState.isValid === null) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-gray-50">
        <div className="flex items-end gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Loading...
          </h3>
        </div>
        <p className="text-gray-500">
          Please wait while we prepare your workspace.
        </p>
      </div>
    );
  }

  // Show error if validation failed
  if (!authState.isValid) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">❌</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Invalid Theme Code
          </h3>
          <p className="text-gray-500">
            The theme code "{params.id}" is not valid
          </p>
        </div>
      </div>
    );
  }

  const themeId = authState.themeId!;

  const findHomeTemplate = (theme: any) => {
    if (!theme?.templateStructure?.length) {
      return null;
    }

    return (
      theme.templateStructure.find(
        (g: any) => g.routePattern === "/" || g.type === "home"
      )?.templates?.[0] ||
      theme.templateStructure[0]?.templates?.[0] ||
      null
    );
  };

  const handleSave = async () => {
    if (!themeId || !templateMeta?.id) {
      return;
    }

    setIsSaving(true);
    try {
      if (templateMeta.isDynamic) {
        const { pageConfig } = useEditorState.getState();

        if (!pageConfig) {
          console.error("No page config available for saving");
          return;
        }

        const templateData = {
          metadata: {
            id: templateMeta.id,
            name: templateMeta.name || pageConfig.metadata?.name || "Template",
            brand: themeId,
            type: templateMeta.type || pageConfig.metadata?.type || "page",
            version: pageConfig.metadata?.version || "1.0.0",
            routeContext: templateMeta.routeContext,
          },
          layout: pageConfig.layout,
          sections: pageConfig.sections,
          dataSources: pageConfig.dataSources,
        };

        const result = await api.editor.saveTemplate(
          themeId,
          templateMeta.id,
          templateData
        );
        console.log("Template saved successfully!", result);
      }
      // Translation save is now handled by the store
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <EditorHeader2
        theme={theme}
        selectedTemplateId={templateMeta?.id || null}
        onTemplateChange={(nextTemplateMeta) => {
          // Reset editor-specific state before switching templates to avoid
          // rendering the previous template with the new template's data/translations.
          setPageConfig(null);
          setPendingPageConfig(null);
          setPageData(null);
          setPageDataStale(false);
          setSelectedSection(null);
          setSelectedWidget(null);
          setShowSettingsDrawer(false);

          setTemplateMeta(nextTemplateMeta);
        }}
        onSave={handleSave}
        isSaving={isSaving}
      />

      {templateMeta ? (
        <RightSidebarWidthProvider>
          {templateMeta.isDynamic ? (
            <TemplateEditor templateMeta={templateMeta} themeId={themeId} />
          ) : (
            <TranslationEditor templateMeta={templateMeta} themeId={themeId} />
          )}
        </RightSidebarWidthProvider>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="text-gray-400 text-6xl mb-4">📄</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No Template Selected
            </h3>
            <p className="text-gray-500">
              Please select a template from the header to start editing
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
