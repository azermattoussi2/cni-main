export type CvAnalysisQuality = 'full' | 'low_confidence' | 'ai_fallback' | 'ai_unavailable';
export type CvAnalysisPersistMeta = {
    quality: CvAnalysisQuality;
    extractionMethods: string[];
    textLength: number;
    lowQuality: boolean;
    failureReasons?: string[];
};
type CvStructuredData = {
    name?: string;
    skills: string[];
    education: string[];
    experience: string[];
    projects: string[];
    _analysisMeta?: CvAnalysisPersistMeta;
};
type CvAiResult = {
    score: number | null;
    moyenne: number | null;
    feedback: string;
    strengths: string[];
    weaknesses: string[];
    recommendation: 'accept' | 'reject' | 'need_interview';
};
export type CvAnalysisOutput = {
    extractedData: CvStructuredData;
    extractedHtml: string;
    ai: CvAiResult;
};
/** PDF présent mais extraction texte locale vide (scan, etc.) — traité dans analyzeCv via Gemini sur le fichier. */
export declare class PdfTextEmptyError extends Error {
    readonly resolvedPath: string;
    constructor(resolvedPath: string);
}
export declare class CvAnalysisService {
    static extractTextFromCv(filePath: string): Promise<string>;
    static analyzeCv(filePath: string): Promise<CvAnalysisOutput>;
}
export {};
//# sourceMappingURL=cvAnalysis.service.d.ts.map