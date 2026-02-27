export interface CrowdinPhrase {
  id: number;
  key: string;
  text: string;
  plurals: unknown;
  file_id: number;
  origin_file_id: number | null;
  file_type: string;
  file_format: string;
  is_icu: boolean;
  has_plurals: boolean;
  duplicate_of: string;
  hidden: boolean;
  commented: boolean;
  with_unresolved_issues: boolean;
  translation_status: {
    translated: boolean;
    partially_translated: boolean;
    approved: Record<string, boolean>;
    partially_approved: Record<string, boolean>;
  };
  title: string;
  qa_issues: unknown[];
  origin_translation_id: number | null;
  top_suggestion_text: string | null;
  preview_available: boolean;
  file_path: string;
  is_fully_translated: number;
  is_fully_approved: number;
  is_protected: number;
  has_master_suggestions: boolean;
  unsaved_suggestions: unknown;
  qa_issues_status: number;
  is_contextual_string: boolean;
  contextual_strings: unknown[];
}

export interface CrowdinResponse {
  data: {
    phrases: CrowdinPhrase[];
    request: number;
    page: number;
    pages: number;
    found: number;
    per_page: number;
    filter: number;
    filter_disabled: boolean;
    workflow_step_status: unknown;
    unsaved_translations_count: number;
  };
  version: string;
}

export interface CollectedData {
  phrases: CrowdinPhrase[];
  totalPages: number;
  pagesCollected: Set<number> | number[];
  found: number;
}

export type Message =
  | { type: "GET_STATUS" }
  | { type: "START_LISTENING" }
  | { type: "STOP_LISTENING" }
  | { type: "CLEAR_DATA" }
  | { type: "GENERATE_FILES" }
  | {
      type: "STATUS";
      listening: boolean;
      phrasesCount: number;
      pagesCollected: number[];
      totalPages: number | null;
      found: number | null;
      fileGroups: string[];
    }
  | {
      type: "FILES_READY";
      files: GeneratedFile[];
    };

export interface GeneratedFile {
  filename: string;
  content: string;
}
