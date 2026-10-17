import type { ApiResponse } from '@/service/api/types/common';

export interface DownloadTemplateResponse {
  file_url: string;
}

export interface ImportResult {
  file_url: string;
}

export type DownloadTemplateApiResponse = ApiResponse<DownloadTemplateResponse>;

export type ImportApiResponse = ApiResponse<ImportResult>;
