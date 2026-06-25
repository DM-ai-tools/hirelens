export const JD_DOCUMENT_EXTENSIONS = [
  ".pdf",
  ".docx",
  ".doc",
  ".txt",
  ".md",
  ".rtf",
  ".odt",
  ".html",
  ".htm",
] as const;

export function isSupportedDocumentExtension(fileName: string): boolean {
  const dot = fileName.lastIndexOf(".");
  if (dot === -1) return false;
  const ext = fileName.slice(dot).toLowerCase();
  return (JD_DOCUMENT_EXTENSIONS as readonly string[]).includes(ext);
}
