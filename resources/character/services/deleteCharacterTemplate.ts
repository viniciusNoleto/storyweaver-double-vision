import { appClient } from '@/utils/app-client';

export function deleteCharacterTemplateService({ templateId }: { templateId: number }) {
  return appClient.delete<null>(`/api/character-templates/${templateId}`, { body: {} });
}
