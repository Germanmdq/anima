declare module "pdf-parse" {
  interface PdfData {
    /** Número de páginas */
    numpages: number;
    /** Número de renders */
    numrender: number;
    /** Información del PDF */
    info: Record<string, unknown>;
    /** Metadata del PDF */
    metadata: unknown;
    /** Texto extraído completo */
    text: string;
    /** Versión del parser */
    version: string;
  }

  interface PdfParseOptions {
    pagerender?: (pageData: unknown) => Promise<string>;
    max?: number;
    version?: string;
  }

  function pdfParse(
    dataBuffer: Buffer,
    options?: PdfParseOptions
  ): Promise<PdfData>;

  export default pdfParse;
}
