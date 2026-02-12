import type {
  PageConfig,
  RouteContext,
} from "@/lib/page-builder/models/page-config-types";

/**
 * Editor API - Real data fetching for the editor
 */
export class EditorAPI {
  private static apiURL =
    process.env.NEXT_PUBLIC_EDITOR_API_URL || "http://localhost:3000";

  static async getThemes(): Promise<any> {
    try {
      const response = await fetch(`${this.apiURL}/api/v1/themes`);
      if (!response.ok) {
        throw new Error("Failed to fetch themes");
      }
      const data = await response.json();
      return data.data.themes;
    } catch (error) {
      throw new Error("Failed to fetch themes");
    }
  }

  static async getTheme(themeId: string): Promise<any> {
    try {
      const response = await fetch(`/editor/api/themes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeId }),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch theme");
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      throw new Error("Failed to fetch theme");
    }
  }

  static async getTemplate(
    merchantName: string,
    routeContext: RouteContext,
    variant: string
  ): Promise<any> {
    try {
      const response = await fetch(`/editor/api/templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantName,
          routeContext,
          variant,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch template");
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      throw new Error("Failed to fetch template");
    }
  }

  static async saveTemplate(
    themeId: string,
    templateId: string,
    templateData: {
      metadata: {
        id: string;
        name: string;
        brand: string;
        type: string;
        version: string;
        routeContext?: any;
      };
      layout?: any;
      sections: any[];
      dataSources: Record<string, any>;
    }
  ): Promise<{
    templateId: string;
    version: string;
    savedAt: string;
  }> {
    try {
      const response = await fetch(
        `${this.apiURL}/api/v1/themes/${themeId}/templates/${templateId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(templateData),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to save template");
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      throw new Error("Failed to save template");
    }
  }

  static async getTranslation(
    themeId: string,
    templateId: string,
    language: string
  ): Promise<any> {
    try {
      const response = await fetch(`/editor/api/translations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeId, templateId, language }),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch translation");
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      throw new Error("Failed to fetch translation");
    }
  }

  static async saveTranslation(
    themeId: string,
    templateId: string,
    language: string,
    translations: Record<string, any>
  ): Promise<{
    language: string;
    templateId: string;
    savedAt: string;
  }> {
    try {
      const response = await fetch(
        `${this.apiURL}/api/v1/themes/${themeId}/translations/${templateId}/${language}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ translations }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Save translation failed:", errorText);
        throw new Error(
          `Failed to save translation: ${response.status} ${response.statusText}`
        );
      }

      const responseData = await response.json();
      return (
        responseData.data || {
          language,
          templateId,
          savedAt: new Date().toISOString(),
        }
      );
    } catch (error) {
      console.error("Save translation error:", error);
      throw new Error("Failed to save translation");
    }
  }

  /**
   * Fetch real data for the editor using the same pipeline as production
   */
  static async fetchEditorData({
    pageConfig,
    routeContext,
    merchantName,
  }: {
    pageConfig: PageConfig;
    routeContext: RouteContext;
    merchantName: string;
  }): Promise<Record<string, any>> {
    try {
      const response = await fetch(`/editor/api/editor-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageConfig, routeContext, merchantName }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to fetch editor data: ${response.status} ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      return { merchantName };
    }
  }

  /**
   * Get merchant ID from the API endpoint
   */
  static async getMerchantName(): Promise<string> {
    try {
      const response = await fetch(`/editor/api/merchant-name`);
      if (!response.ok) {
        throw new Error("Failed to fetch merchant Name");
      }
      const data = await response.json();
      return data.data.merchantName;
    } catch (error) {
      console.error("Error fetching merchant ID:", error);
      // Fallback to default value
      return "merchant1";
    }
  }

  /**
   * Validate merchant auth via server route
   */
  static async validateMerchantAuth(themeCode: string): Promise<{
    isValid: boolean;
    themeId?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`/editor/api/merchant-validation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeCode }),
      });
      if (!response.ok) {
        throw new Error(`Failed to validate merchant: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error("Merchant validation error:", error);
      return { isValid: false, error: "Failed to validate merchant" };
    }
  }

  /**
   * Fetch data source options (collections or products) for dropdowns
   */
  static async getDataSourceOptions(
    type: "collections" | "products"
  ): Promise<Array<{ value: string; label: string }>> {
    try {
      const response = await fetch(`/editor/api/data-source-options`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to fetch data source options: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error("Error fetching data source options:", error);
      return [];
    }
  }

  /**
   * Transcribe audio using OpenAI Whisper
   */
  static async transcribeAudio(audioBlob: Blob): Promise<string> {
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "voice.webm");

      const response = await fetch(`/editor/api/whisper`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Whisper API error:", errorText);
        throw new Error(
          `Failed to transcribe audio: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data.text || "";
    } catch (error) {
      console.error("Error transcribing audio:", error);
      throw new Error("Failed to transcribe audio");
    }
  }

  /**
   * Call Anthropic Messages API via server-side proxy route.
   * This keeps the API key on the server.
   */
  static async anthropicMessages(requestBody: any): Promise<any> {
    try {
      const response = await fetch(`/editor/api/anthropic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestBody }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        console.error("Anthropic proxy error:", errorText);
        throw new Error(
          `Failed to call Anthropic proxy: ${response.status} ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error calling Anthropic proxy:", error);
      throw new Error("Failed to generate AI response");
    }
  }
}

// Export API
export const api = {
  editor: EditorAPI,
};
