import type { CrowdinPhrase, GeneratedFile } from "./types";

export function filePathToPrefix(filePath: string): string {
  return filePath
    .replace(/^\//, "") // remove leading slash
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_") // replace non-alphanumeric with underscore
    .replace(/^_|_$/g, ""); // trim leading/trailing underscores
}

export function filePathToFilename(filePath: string): string {
  return `${filePathToPrefix(filePath)}.properties`;
}

function escapePropertiesValue(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

function groupByFilePath(
  phrases: CrowdinPhrase[],
): Map<string, CrowdinPhrase[]> {
  const groups = new Map<string, CrowdinPhrase[]>();
  for (const phrase of phrases) {
    const path = phrase.file_path || "/unknown";
    if (!groups.has(path)) {
      groups.set(path, []);
    }
    groups.get(path)!.push(phrase);
  }
  return groups;
}

export function generatePropertiesFiles(
  phrases: CrowdinPhrase[],
): GeneratedFile[] {
  const groups = groupByFilePath(phrases);
  const files: GeneratedFile[] = [];

  for (const [filePath, groupPhrases] of groups) {
    const prefix = filePathToPrefix(filePath);
    const baseName = filePathToFilename(filePath);

    groupPhrases.sort((a, b) => a.id - b.id);

    const englishLines: string[] = [];
    englishLines.push(`# English properties for: ${filePath}`);
    englishLines.push("");

    const translationLines: string[] = [];
    translationLines.push(`# Translation properties for: ${filePath}`);
    translationLines.push("");

    groupPhrases.forEach((phrase, index) => {
      const key = `${prefix}.${index}`;
      const englishValue = escapePropertiesValue(phrase.text || "");
      const translationValue = escapePropertiesValue(
        phrase.top_suggestion_text || "",
      );

      if (translationValue === "") {
        englishLines.push(`${key}=${englishValue}`);
        translationLines.push(
          `#${key}=${translationValue} # No translation available`,
        );
      } else {
        englishLines.push(`${key}=${englishValue}`);
        translationLines.push(`${key}=${translationValue}`);
      }
    });

    files.push({
      filename: `en_${baseName}`,
      content: englishLines.join("\n"),
    });

    files.push({
      filename: `translated_${baseName}`,
      content: translationLines.join("\n"),
    });
  }

  return files;
}
