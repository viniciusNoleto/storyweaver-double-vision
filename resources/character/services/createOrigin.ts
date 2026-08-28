import { appClient } from '@/utils/app-client';
import { PayloadBody } from '@/shared/types/api';
import type { IAttributeBonus, IOrigin } from '../models/RulesContent';

export type CreateOriginServicePayload = {
  name: string;
  description: string;
  attribute_bonuses: IAttributeBonus[];
  granted_proficiency: string;
};

export function createOriginService({ body }: PayloadBody<CreateOriginServicePayload>) {
  return appClient.post<IOrigin>('/api/origins', { body });
}
