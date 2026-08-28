import { appClient } from '@/utils/app-client';

export type UploadCharacterImageServiceResponse = {
  url: string;
};

// Multipart/form-data — não usa `PayloadBody` (é JSON-only) nem `Content-Type`
// manual (o browser define o boundary certo sozinho quando o body é um
// `FormData`).
export function uploadCharacterImageService({ file }: { file: File }) {
  const formData = new FormData();

  formData.append('file', file);

  return appClient.post<UploadCharacterImageServiceResponse>('/api/uploads/characters', { body: formData });
}
