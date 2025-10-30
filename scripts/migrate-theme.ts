import fs from "fs";
import path from "path";
import { TEMPLATE_TYPES } from "../src/core/constants/template";
import { getTemplateId } from "../src/lib/ids/template-id";

type TemplateEntry = {
  id: string;
  name: string;
  variant: string;
  isDynamic: boolean;
  supportedLanguages: string[];
  routeContext?: unknown;
};

type TemplateGroup = {
  name: string;
  templates: TemplateEntry[]; // include default and non-default variants
};

type ThemeStructure = {
  id: string;
  name: string;
  templateStructure: TemplateGroup[];
};

function toDisplayName(templateName: string): string {
  return templateName
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const DYNAMIC_TYPES = new Set(
  Object.values(TEMPLATE_TYPES).map((v) => v.toLowerCase())
);

function isDynamicFor(templateName: string): boolean {
  return DYNAMIC_TYPES.has(templateName.toLowerCase());
}

function buildTemplateDisplayName(
  templateName: string,
  variant: string
): string {
  const group = toDisplayName(templateName);
  const variantDisplay = toDisplayName(variant);
  return `${group} (${variantDisplay})`;
}

async function generateForMerchant(
  merchant: string,
  rootDir: string
): Promise<ThemeStructure> {
  const registryModulePath = path.join(
    rootDir,
    "src",
    "themes",
    merchant,
    "theme-registry.ts"
  );
  if (!fs.existsSync(registryModulePath)) {
    throw new Error(`Theme registry not found at ${registryModulePath}`);
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require(registryModulePath);
  const registry = (mod.themeRegistry || mod.default || {}) as {
    id?: string;
    supportedLanguages?: string[];
    templateStructure: Record<string, Record<string, any>>;
  };

  const supportedLanguages = registry.supportedLanguages || [];

  const groups: TemplateGroup[] = [];
  const migrationTasks: Array<() => Promise<void>> = [];

  for (const [templateName, variantsObj] of Object.entries(
    registry.templateStructure || {}
  )) {
    const group: TemplateGroup = {
      name: toDisplayName(templateName),
      templates: [],
    };
    for (const variant of Object.keys(variantsObj)) {
      const variantConfig = (variantsObj as Record<string, any>)[variant] || {};
      const dynamic = isDynamicFor(templateName);
      const templateId = dynamic
        ? getTemplateId({
            merchantName: merchant,
            templateName,
            variant,
          })
        : getTemplateId({ staticTemplateId: templateName });

      const entry: TemplateEntry = {
        id: templateId,
        name: buildTemplateDisplayName(templateName, variant),
        variant,
        isDynamic: dynamic,
        supportedLanguages,
        routeContext: variantConfig.routeContext
          ? { ...variantConfig.routeContext, fetchAPITemplate: true }
          : undefined,
      };
      group.templates.push(entry);

      // Defer migration calls until after theme sync
      if (dynamic && variantConfig.templatePath) {
        migrationTasks.push(() =>
          updateTemplate(templateId, variantConfig.templatePath, merchant)
        );
      }

      if (variantConfig.translationsPath) {
        migrationTasks.push(() =>
          updateTranslations(
            templateId,
            variantConfig.translationsPath,
            merchant
          )
        );
      }
    }
    group.templates.sort((a, b) => a.variant.localeCompare(b.variant));
    groups.push(group);
  }

  const themeStructure: ThemeStructure = {
    id: merchant,
    name: merchant.toUpperCase(),
    templateStructure: groups,
  };

  // Sync theme structure to backend (create or update)
  await syncThemeInBackend({
    themeId: merchant,
    name: merchant.toUpperCase(),
    templateStructure: groups,
  });

  // Run deferred migration tasks after theme exists/updated in backend
  for (const task of migrationTasks) {
    try {
      await task();
    } catch (e) {
      // Errors are already logged inside called functions
    }
  }

  // Upload common translations if present (after theme exists)
  const commonDir = path.join(
    rootDir,
    "src",
    "themes",
    merchant,
    "locales",
    "common"
  );
  if (fs.existsSync(commonDir)) {
    await updateTranslations(
      "common",
      `themes/${merchant}/locales/common`, // This is the path to the common translations directory
      merchant
    );
  }

  return themeStructure;
}

function writeThemeStructure(
  merchant: string,
  rootDir: string,
  data: ThemeStructure
) {
  const themeDir = path.join(rootDir, "src", "themes", merchant);
  if (!fs.existsSync(themeDir)) {
    fs.mkdirSync(themeDir, { recursive: true });
  }
  const outPath = path.join(themeDir, "theme-structure.json");
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2), "utf8");
  // eslint-disable-next-line no-console
  console.log(`Wrote ${outPath}`);
}

async function updateTemplate(
  templateId: string,
  templatePath: string,
  merchant: string
) {
  const srcRoot = path.resolve(__dirname, "..", "src");
  const absTemplatePath = path.join(srcRoot, templatePath);

  try {
    if (!fs.existsSync(absTemplatePath)) {
      console.warn(`❌ Template file not found: ${absTemplatePath}`);
      return;
    }

    console.log(`📦 Importing template from: ${absTemplatePath}`);
    const templateModule = await import(`file://${absTemplatePath}`);
    const template = (templateModule as any).template;

    if (!template) {
      console.warn(`⚠️ No 'template' export found in ${absTemplatePath}`);
      return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_EDITOR_API_URL;
    if (!baseUrl) {
      console.warn(
        `⚠️ Skipping API update for ${templateId}: NEXT_PUBLIC_EDITOR_API_URL not set`
      );
      return;
    }

    const payload = {
      dataSources: template.dataSources ?? {},
      sections: template.sections ?? [],
    };
    const url = `${baseUrl}/api/v1/themes/${merchant}/templates/${templateId}`;
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      console.log(`🔄 Updated template for: ${templateId}`);
    } else {
      console.warn(`⚠️ API update failed for ${templateId}: ${res.status}`);
    }
  } catch (error) {
    console.warn(`⚠️ Skipped template update ${templateId}: ${error}`);
  }
}

async function updateTranslations(
  templateId: string,
  translationsPath: string,
  merchant: string
) {
  const srcRoot = path.resolve(__dirname, "..", "src");
  const absTranslationsDir = path.join(srcRoot, translationsPath);

  if (!fs.existsSync(absTranslationsDir)) {
    console.warn(`⚠️ Translations dir not found: ${absTranslationsDir}`);
    return;
  }

  const files = fs
    .readdirSync(absTranslationsDir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith(".json"))
    .map((d) => d.name);

  for (const file of files) {
    try {
      const lang = file.replace(/\.json$/, "");
      const filePath = path.join(absTranslationsDir, file);
      const content = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(content);
      const payload = { translations: parsed };

      const baseUrl = process.env.NEXT_PUBLIC_EDITOR_API_URL;
      if (!baseUrl) {
        console.warn(
          `⚠️ Skipping translations upload for ${templateId}/${lang}: NEXT_PUBLIC_EDITOR_API_URL not set`
        );
        continue;
      }

      const url = `${baseUrl}/api/v1/themes/${merchant}/translations/${templateId}/${lang}`;
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        console.log(`🈸 Uploaded translation: ${templateId}/${lang}`);
      } else {
        console.warn(
          `⚠️ Translation upload failed for ${templateId}/${lang}: ${res.status}`
        );
      }
    } catch (locErr) {
      console.warn(
        `⚠️ Translation upload error for ${templateId}/${file}: ${locErr}`
      );
    }
  }
}

async function getOrCreateMerchantMapping(
  merchantId: string,
  merchantName: string
): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_EDITOR_API_URL;
  if (!baseUrl) {
    throw new Error(
      "NEXT_PUBLIC_EDITOR_API_URL environment variable is required"
    );
  }

  try {
    // First, try to get existing mapping
    const getRes = await fetch(`${baseUrl}/api/v1/merchants/${merchantId}`, {
      method: "GET",
      headers: { accept: "application/json" },
    });

    if (getRes.ok) {
      const data = await getRes.json();
      return data.data.visualEditorId;
    }

    if (getRes.status === 404) {
      // Create new mapping
      const postRes = await fetch(`${baseUrl}/api/v1/merchants`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          merchantId,
          merchantName,
        }),
      });

      if (postRes.ok) {
        const data = await postRes.json();
        console.log(`✅ Created merchant mapping: ${merchantId}`);
        return data.data.visualEditorId;
      } else {
        throw new Error(`Failed to create merchant mapping: ${postRes.status}`);
      }
    }

    throw new Error(`Unexpected response: ${getRes.status}`);
  } catch (error) {
    console.warn(`⚠️ Merchant mapping error: ${error}`);
    throw error;
  }
}

async function syncThemeInBackend(payload: {
  themeId: string;
  name: string;
  templateStructure: TemplateGroup[];
}): Promise<void> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_EDITOR_API_URL;
    if (!baseUrl) {
      console.warn(
        "⚠️ Skipping theme sync: NEXT_PUBLIC_EDITOR_API_URL not set"
      );
      return;
    }

    // Check if theme exists
    const getRes = await fetch(`${baseUrl}/api/v1/themes/${payload.themeId}`, {
      cache: "no-store",
    });

    if (getRes.ok) {
      // Update existing theme
      const putRes = await fetch(
        `${baseUrl}/api/v1/themes/${payload.themeId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: payload.name,
            templateStructure: payload.templateStructure,
          }),
        }
      );
      if (!putRes.ok) {
        const text = await putRes.text().catch(() => "");
        console.warn(
          `⚠️ Theme update failed: ${putRes.status} ${putRes.statusText} ${text}`
        );
      } else {
        console.log(`🔄 Updated theme: ${payload.themeId}`);
      }
      return;
    }

    if (getRes.status === 404) {
      // Create theme
      const postRes = await fetch(`${baseUrl}/api/v1/themes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: payload.themeId,
          name: payload.name,
          templateStructure: payload.templateStructure,
        }),
      });
      if (!postRes.ok) {
        const text = await postRes.text().catch(() => "");
        console.warn(
          `⚠️ Theme creation failed: ${postRes.status} ${postRes.statusText} ${text}`
        );
      } else {
        console.log(`✅ Created theme: ${payload.themeId}`);
      }
      return;
    }

    // Unexpected response
    const txt = await getRes.text().catch(() => "");
    console.warn(
      `⚠️ Unexpected theme GET response ${getRes.status} ${getRes.statusText} ${txt}`
    );
  } catch (err) {
    console.warn(
      `⚠️ Theme sync error for ${payload.themeId}: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
}

async function main() {
  const merchant = process.argv[2] || process.env.MERCHANT_NAME;
  const merchantId = process.env.MERCHANT_ID;

  if (!merchant) {
    // eslint-disable-next-line no-console
    console.error(
      "Usage: ts-node scripts/generate-theme-structure.ts <merchant>\nOr set MERCHANT_NAME env var."
    );
    process.exit(1);
  }

  if (!merchantId) {
    // eslint-disable-next-line no-console
    console.error("MERCHANT_ID environment variable is required");
    process.exit(1);
  }

  const rootDir = path.resolve(__dirname, "..");

  console.log(
    `🚀 Starting ${merchant} theme structure generation & migration...`
  );

  // Get or create merchant mapping
  const visualEditorId = await getOrCreateMerchantMapping(merchantId, merchant);

  const data = await generateForMerchant(merchant, rootDir);
  writeThemeStructure(merchant, rootDir, data);

  console.log(
    `✅ ${merchant} theme structure generation & migration completed!`
  );

  // Output editor URL
  const editorServerUrl =
    process.env.NEXT_PUBLIC_EDITOR_SERVER_URL || "http://localhost:3000";
  console.log(`\n🎯 Editor URL: ${editorServerUrl}/editor/${visualEditorId}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
