import React, { useEffect, useState, useMemo, useCallback } from "react";
import { WidgetInjector } from "@/lib/page-builder/core/widget-injector";
import { LayoutRenderer } from "@/lib/page-builder/core/layout-renderer";
import { StyleProcessor } from "@/lib/page-builder/core/style-processor";
import { FileSystemThemeLoader } from "@/theme-loader";
import { createThemeRegistry } from "@/lib/theme/registroy-factor";
import { SectionWrapper } from "@/ui/layout/SectionWrapper";
import { TranslationService } from "@/lib/i18n/translation-service";
import { Locale } from "@/lib/i18n/config";
import { translatePageConfig } from "../../utils/page-config-translator";
import { api } from "../../services/api";
import Frame from "react-frame-component";
import {
  useEditorState,
  RESPONSIVE_FRAME_STYLE,
} from "../../stores/useEditorState";
import BuilderToolbar from "../ui/BuilderToolbar";
import { useDualTranslationStore } from "../../stores/dualTranslationStore";

// Import widget registry setup to ensure widgets are registered
import "@/core/widget-registry-setup";

interface TemplateEditorProps {
  templateMeta: any;
  themeId?: string;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({
  templateMeta,
  themeId,
}) => {
  const {
    pageConfig,
    pendingPageConfig,
    setPageConfig,
    pageData,
    setPageData,
    pageDataStale,
    setPageDataStale,
    setPendingPageConfig,
    setSelectedSection,
    setSelectedWidget,
    setShowSettingsDrawer,
    setThemeId,
    setTemplateId,
    routeContext,
    setRouteContext,
    updateRouteHandle,
    device,
    mode,
  } = useEditorState();

  const [themeStyles, setThemeStyles] = useState<Record<string, any> | null>(
    null
  );
  const [isLoadingData, setIsLoadingData] = useState(false);
  const { translations, language, setLanguage, getTranslations } =
    useDualTranslationStore();

  // Create translation service reactively based on current state
  const translationService = useMemo(() => {
    if (!translations || Object.keys(translations).length === 0) {
      return null;
    }
    return new TranslationService(language as Locale, translations);
  }, [language, translations]);

  useEffect(() => {
    setRouteContext(templateMeta.routeContext);
    setTemplateId(templateMeta.id);
  }, [
    setRouteContext,
    setTemplateId,
    templateMeta?.routeContext,
    templateMeta?.id,
  ]);

  // Load merchant ID, template, and i18n data in a single useEffect
  useEffect(() => {
    if (!templateMeta?.id || !themeId || !routeContext) {
      return;
    }

    let isCancelled = false;

    const runPipeline = async () => {
      setIsLoadingData(true);

      try {
        // Set theme in editor state
        setThemeId(themeId);

        // 1. Load merchant ID first
        const merchantNameFromAPI = await api.editor.getMerchantName();
        if (isCancelled) {
          return;
        }

        // 2. Load translations for default locale
        await getTranslations(themeId, templateMeta.id, language);

        // 3. Load Template
        const template = await api.editor.getTemplate(
          themeId,
          routeContext,
          templateMeta.variant
        );
        if (isCancelled) {
          return;
        }

        // Close settings overlay when template changes
        setSelectedSection(null);
        setSelectedWidget(null);
        setShowSettingsDrawer(false);

        // 4. Fetch Data
        const realData = await api.editor.fetchEditorData({
          pageConfig: template,
          routeContext,
          merchantName: merchantNameFromAPI,
        });
        if (isCancelled) {
          return;
        }
        setPageData(realData);
        setPageConfig(template);

        // 5. Process Styles
        const themeLoader = new FileSystemThemeLoader();
        const themeRegistry = createThemeRegistry(themeLoader);
        const styleProcessor = new StyleProcessor(themeRegistry);
        const styles = await styleProcessor.processStyles({
          merchantName: merchantNameFromAPI,
          pageConfig: template.pageConfig,
        });
        if (isCancelled) {
          return;
        }
        setThemeStyles(styles);
      } catch (err) {
        console.error("Template pipeline error:", err);
        if (!isCancelled) {
          // fallback style
          setThemeStyles({
            spacing: {
              container: "768px",
              "container-xl": "1280px",
            },
          });
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingData(false);
        }
      }
    };

    runPipeline();

    return () => {
      isCancelled = true;
    };
  }, [templateMeta?.id, themeId, routeContext]);

  // Refetch data when editor marks page data as stale (e.g., new dynamic section)
  useEffect(() => {
    const refetchData = async () => {
      const configForFetch = pendingPageConfig || pageConfig;
      if (!configForFetch || !themeId || !routeContext || !pageDataStale)
        return;

      let isCancelled = false;
      setIsLoadingData(true);

      try {
        const merchantNameFromAPI = await api.editor.getMerchantName();
        if (isCancelled) return;

        const realData = await api.editor.fetchEditorData({
          pageConfig: configForFetch,
          routeContext,
          merchantName: merchantNameFromAPI,
        });
        if (isCancelled) return;
        setPageData(realData);
        if (pendingPageConfig) {
          setPageConfig(pendingPageConfig);
          setPendingPageConfig(null);
        }
      } catch (err) {
        console.error("Error refetching editor data after config change:", err);
      } finally {
        if (!isCancelled) {
          setIsLoadingData(false);
          setPageDataStale(false);
        }
      }
    };

    refetchData();
  }, [
    pageConfig,
    pendingPageConfig,
    routeContext,
    themeId,
    pageDataStale,
    setPageData,
    setPageDataStale,
    setPageConfig,
    setPendingPageConfig,
  ]);

  // Collect parent stylesheets and style tags for iframe
  const headContent = useMemo(() => {
    if (typeof document === "undefined") {
      return "";
    }

    const links = Array.from(
      document.querySelectorAll('link[rel="stylesheet"]')
    )
      .map((link) => link.outerHTML)
      .join("\n");

    const styles = Array.from(document.querySelectorAll("style"))
      .map((style) => style.outerHTML)
      .join("\n");

    return `${links}\n${styles}`;
  }, []);

  // Copy font classes from root HTML to iframe HTML
  // Stylesheets are already copied via headContent, we just need the classes
  const rootHtmlClassName = useMemo(() => {
    if (typeof document === "undefined") {
      return "";
    }
    return document.documentElement.className || "";
  }, []);
  const editorPreviewClass = "editor-preview";

  // ✅ Move all hooks before conditional returns to follow Rules of Hooks
  const widgetInjector = new WidgetInjector();

  // Map device to breakpoint: desktop/fullscreen → desktop, tablet → tablet, mobile → mobile
  const breakpoint: "mobile" | "tablet" | "desktop" =
    device === "fullscreen" ? "desktop" : device;

  const layoutRenderer = new LayoutRenderer((section, children, styles) => (
    <SectionWrapper section={section} styles={styles} breakpoint={breakpoint}>
      {children}
    </SectionWrapper>
  ));

  const styles = themeStyles || {};

  // ✅ Memoize translated page config to trigger re-render on language change
  const translatedPageConfig = useMemo(() => {
    if (!pageConfig || !translationService) {
      return pageConfig;
    }
    return translatePageConfig(pageConfig, translationService);
  }, [pageConfig, translationService]);

  // ✅ Memoize widgets injection to trigger re-render on language change
  const widgets = useMemo(() => {
    if (!translatedPageConfig || !pageData) {
      return {};
    }
    return widgetInjector.injectWidgets({
      pageConfig: translatedPageConfig,
      pageData,
      routeContext,
      translationService: translationService || undefined,
    });
  }, [translatedPageConfig, pageData, routeContext, translationService]);

  // ✅ Memoize callbacks to prevent unnecessary re-renders
  const onSelectSection = useCallback(
    (sectionId: string) => {
      setSelectedSection(sectionId);
      setShowSettingsDrawer(true);
    },
    [setSelectedSection, setShowSettingsDrawer]
  );

  const onSelectWidget = useCallback(
    (sectionId: string, widgetId: string) => {
      setSelectedSection(sectionId);
      setSelectedWidget(widgetId);
      setShowSettingsDrawer(true);
    },
    [setSelectedSection, setSelectedWidget, setShowSettingsDrawer]
  );

  // ✅ Memoize layout rendering to trigger re-render on language/device change
  const renderedLayout = useMemo(() => {
    if (!translatedPageConfig) {
      return null;
    }
    return (layoutRenderer as any).renderLayout({
      pageConfig: translatedPageConfig,
      widgets,
      styles,
      routeContext,
      isEditing: mode === "edit",
      onSelectSection,
      onSelectWidget,
    });
  }, [
    breakpoint,
    translatedPageConfig,
    widgets,
    styles,
    routeContext,
    mode,
    onSelectSection,
    onSelectWidget,
  ]);

  // ✅ Conditional returns AFTER all hooks
  if (!pageConfig) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading template...</div>
      </div>
    );
  }

  if (!translationService) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading translations...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0">
      {device !== "fullscreen" && (
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
          <BuilderToolbar
            templateName={templateMeta?.name}
            pageConfig={pageConfig}
            translationService={translationService}
            currentLocale={language}
            supportedLanguages={templateMeta?.supportedLanguages || ["en"]}
            routeContext={routeContext}
            onRouteHandleChange={updateRouteHandle}
            onLocaleChange={async (newLocale) => {
              setLanguage(newLocale);
              if (templateMeta?.id && themeId) {
                await getTranslations(themeId, templateMeta.id, newLocale);
              }
            }}
          />
        </div>
      )}
      <div className="flex-1 overflow-auto p-4 flex justify-center">
        <Frame
          style={RESPONSIVE_FRAME_STYLE[device]}
          initialContent={`<!DOCTYPE html>
            <html${rootHtmlClassName ? ` class="${rootHtmlClassName}"` : ""}>
              <head>
                <meta name='viewport' content='width=device-width, initial-scale=1'>
                ${headContent}
                <style>
                  html,body,#mountHere{width:100%;height:100%;margin:0;padding:0;}
                  #website-canvas{}
                </style>
              </head>
              <body class="${editorPreviewClass}">
                <div id='mountHere'></div>
              </body>
            </html>`}
          mountTarget="#mountHere"
        >
          <div id="website-canvas">
            {isLoadingData && pageData && (
              <>
                <style>{`
                  @keyframes editor-progress-indeterminate {
                    0% { transform: translateX(-100%); }
                    50% { transform: translateX(0%); }
                    100% { transform: translateX(100%); }
                  }
                `}</style>
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full w-1/3 bg-gradient-to-r from-blue-500 via-sky-400 to-blue-600"
                    style={{
                      animation:
                        "editor-progress-indeterminate 1.2s ease-in-out infinite",
                    }}
                  />
                </div>
              </>
            )}
            {pageData ? (
              renderedLayout
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">
                  {isLoadingData ? "Loading data..." : "Loading preview..."}
                </div>
              </div>
            )}
          </div>
        </Frame>
      </div>
    </div>
  );
};

export default TemplateEditor;
