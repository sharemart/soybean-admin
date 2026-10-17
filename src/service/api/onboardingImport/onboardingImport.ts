import { request } from '../../request';
import type { DownloadTemplateApiResponse, ImportApiResponse } from './onboardingImport.d';

export function downloadTemplate() {
  return request<DownloadTemplateApiResponse>({
    url: '/dashboard/onboardingImport/downloadTemplate',
    method: 'GET'
  });
}

export function importOnboarding(params: FormData) {
  return request<ImportApiResponse>({
    url: '/dashboard/onboardingImport/import',
    method: 'POST',
    data: params,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}
