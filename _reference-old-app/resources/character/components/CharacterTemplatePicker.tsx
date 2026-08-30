'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ActionIcon, Avatar, Card, Group, Loader, Modal, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Icon } from '@iconify/react';
import { getCharacterTemplatesService, GET_CHARACTER_TEMPLATES_KEY } from '../services/getCharacterTemplates';
import { deleteCharacterTemplateService } from '../services/deleteCharacterTemplate';
import { createCharacterService } from '../services/createCharacter';
import type { ECharacterKind } from '../enums/CharacterKind';
import type { ICharacterTemplate } from '../models/CharacterTemplate';

// Lista de Personagens Salvos de um tipo (Personagem/NPC) — clicar num item
// já cria a ficha na Mesa atual (mesmo endpoint de sempre, `zone_id` default
// definido pelo servidor). Ver `.claude/rules/table-concept.md`.
export function CharacterTemplatePicker({
  code,
  kind,
  opened,
  onCancel,
  onCreated,
}: {
  code: string;
  kind: ECharacterKind;
  opened: boolean;
  onCancel: () => void;
  onCreated: () => void;
}) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: GET_CHARACTER_TEMPLATES_KEY(kind),
    queryFn: ({ signal }) => getCharacterTemplatesService({ signal, kind }),
    enabled: opened,
  });

  const useTemplateMutation = useMutation({
    mutationFn: (template: ICharacterTemplate) => createCharacterService({
      code,
      body: {
        name: template.name,
        image_url: template.image_url,
        hp_current: template.hp_max,
        hp_max: template.hp_max,
        has_mana: template.has_mana,
        mana_current: template.mana_max,
        mana_max: template.mana_max,
      },
    }),
    onSuccess: (res) => {
      notifications.show({ message: res.message['pt-br'], color: 'green' });

      onCreated();
    },
    onError: (err: any) => {
      notifications.show({
        title: 'Erro',
        message: err?.data?.message?.['pt-br'] ?? 'Não foi possível adicionar o personagem. Tente novamente.',
        color: 'red',
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (templateId: number) => deleteCharacterTemplateService({ templateId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: GET_CHARACTER_TEMPLATES_KEY(kind) }),
    onError: (err: any) => {
      notifications.show({
        title: 'Erro',
        message: err?.data?.message?.['pt-br'] ?? 'Não foi possível remover o personagem salvo.',
        color: 'red',
      });
    },
  });

  const templates = data?.data ?? [];

  return (
    <Modal
      opened={opened}
      onClose={onCancel}
      title="Personagens salvos"
      centered
    >
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader color="primary" />
        </div>
      ) : (
        <Stack gap="sm">
          {templates.length === 0 ? (
            <Text
              size="sm"
              c="dimmed"
              className="text-center py-4"
            >
              Nenhum personagem salvo ainda.
            </Text>
          ) : null}

          {templates.map((template) => (
            <Card
              key={template.id}
              padding="sm"
              className="cursor-pointer transition hover:border-primary-400/60"
              onClick={() => !useTemplateMutation.isPending && useTemplateMutation.mutate(template)}
            >
              <Group
                justify="space-between"
                wrap="nowrap"
              >
                <Group
                  gap="sm"
                  wrap="nowrap"
                  className="min-w-0"
                >
                  <Avatar
                    src={template.image_url}
                    size={40}
                    radius="xl"
                  >
                    <Icon icon="lucide:user" />
                  </Avatar>

                  <div className="min-w-0">
                    <Text
                      fw={600}
                      className="truncate"
                    >
                      {template.name}
                    </Text>

                    <Text
                      size="xs"
                      c="dimmed"
                    >
                      {`Vida: ${template.hp_max}${template.has_mana ? ` · Mana: ${template.mana_max}` : ''}`}
                    </Text>
                  </div>
                </Group>

                <ActionIcon
                  variant="subtle"
                  color="secondary"
                  disabled={deleteTemplateMutation.isPending}
                  onClick={(event) => {
                    event.stopPropagation();
                    deleteTemplateMutation.mutate(template.id);
                  }}
                >
                  <Icon icon="lucide:trash-2" />
                </ActionIcon>
              </Group>
            </Card>
          ))}
        </Stack>
      )}
    </Modal>
  );
}
