function readFileAsBase64(
  file: File
): Promise<{ mediaType: string; data: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const result = reader.result;
        if (typeof result !== "string") {
          reject(new Error("Failed to read file as data URL"));
          return;
        }

        const match = result.match(/^data:(.*?);base64,(.*)$/);
        if (!match) {
          reject(new Error("Invalid data URL format"));
          return;
        }

        const mediaType = match[1];
        const data = match[2];
        resolve({ mediaType, data });
      } catch (error) {
        reject(error as Error);
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });
}

export class AIAPI {
  static async generateCustomHtmlSnippet({
    userMessage,
    currentHtml,
    imageFile,
  }: {
    userMessage: string;
    currentHtml?: string;
    imageFile?: File | null;
  }): Promise<string> {
    const apiKey = process.env.NEXT_PUBLIC_AI_API_KEY;
    if (!apiKey) {
      console.error("NEXT_PUBLIC_AI_API_KEY is not set");
      throw new Error("AI API key is not configured");
    }

    const trimmedMessage = userMessage.trim();
    const trimmedHtml = (currentHtml || "").trim();

    const currentCodeContext = trimmedHtml
      ? `\n\nCurrent code in editor:\n\`\`\`html\n${trimmedHtml}\n\`\`\``
      : "";

    const prompt = `You are an experienced frontend developer, ensuring stability and good coding practices give me a code snippet for the following

Goal: Create a standalone, embeddable HTML snippet based on this input (which might include images for reference as well): **${trimmedMessage}**${currentCodeContext}

Technical constraints to follow:

No Boilerplate: Do NOT include <html>, <head>, or <body> tags.

Structure: Provide one continuous block containing <style>, the HTML markup, and <script>.

Style Isolation: To prevent the CSS from affecting the parent website, wrap the entire HTML in a <div> with a unique ID (e.g., id="custom-widget-unique"). Prefix all CSS selectors with this ID. Make sure the styling is minimal and the code is not too lengthy, combine classes and styling where possible, ensure readability and best css coding practices.

Vanilla Only: Use only plain HTML5, CSS3, and modern Vanilla JavaScript.

Responsiveness: Ensure standard responsiveness. Flexbox is generally followed across the codebase.

Safety and stability: Ensure all script tag codes are wrapped inside try catch blocks.

Make the code simple and easy to understand, finding balance, between best coding practices and readability, and write minimal code. Also it is not necessary to generate all 3 (Markup, script and css tags) if one of them is not required. Eg. if script is not required, don't add a script, or if custom css is not required and we can make do with tailwind, then don't add custom css.

Output: Give me the code block ready for immediate copy-pasting into a custom code editor.`;

    const messageContent: Array<
      | { type: "text"; text: string }
      | {
          type: "image";
          source: {
            type: "base64";
            media_type: string;
            data: string;
          };
        }
    > = [
      {
        type: "text",
        text: prompt,
      },
    ];

    if (imageFile) {
      try {
        const { mediaType, data } = await readFileAsBase64(imageFile);
        messageContent.push({
          type: "image",
          source: {
            type: "base64",
            media_type: mediaType,
            data,
          },
        });
      } catch (error) {
        console.error(
          "Failed to read attached image, continuing without image:",
          error
        );
      }
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: messageContent,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Anthropic API error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      throw new Error(
        `API error: ${response.status} - ${
          (errorData as any)?.error?.message || response.statusText
        }`
      );
    }

    const data = await response.json();
    const generatedHtml = data.content?.[0]?.text || "";

    if (!generatedHtml) {
      return "";
    }

    const htmlMatch =
      generatedHtml.match(/```(?:html)?\s*([\s\S]*?)```/) ||
      generatedHtml.match(/```([\s\S]*?)```/);
    const cleanHtml = htmlMatch ? htmlMatch[1].trim() : generatedHtml.trim();
    return cleanHtml;
  }
}


