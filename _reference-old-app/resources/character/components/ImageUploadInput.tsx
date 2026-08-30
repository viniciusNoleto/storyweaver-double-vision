'use client';

import { useState } from 'react';
import { Avatar, FileButton, Button, Group, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Icon } from '@iconify/react';
import { uploadCharacterImageService } from '../services/uploadCharacterImage';

// Substitui o antigo `TextInput` de "URL da imagem" em todo formulário de
// personagem/NPC (ver `.claude/rules/table-concept.md`). Controlado como
// `value: string` (o `image_url` do formulário) — igual antes — só que agora
// o valor vem de um upload (`/api/uploads/characters`) em vez de digitação
// manual. Faz o upload assim que o arquivo é escolhido (não espera o submit
// do formulário) para o preview já refletir a imagem real.
export function ImageUploadInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);

  function handleFile(file: File | null) {
    if (!file) return;

    setIsUploading(true);

    uploadCharacterImageService({ file })
      .then((res) => onChange(res.data.url))
      .catch((err: any) => {
        notifications.show({
          title: 'Erro',
          message: err?.data?.message?.['pt-br'] ?? 'Não foi possível enviar a imagem. Tente novamente.',
          color: 'red',
        });
      })
      .finally(() => setIsUploading(false));
  }

  return (
    <Group
      align="center"
      gap="sm"
    >
      <Avatar
        src={value.trim() || null}
        size={48}
        radius="xl"
      >
        <Icon
          icon="lucide:user"
          width={24}
          height={24}
        />
      </Avatar>

      <FileButton
        onChange={handleFile}
        accept="image/png,image/jpeg,image/webp,image/gif"
      >
        {(props) => (
          <Button
            {...props}
            variant="light"
            loading={isUploading}
            leftSection={(
              <Icon icon="lucide:upload" />
            )}
          >
            {value ? 'Trocar foto' : 'Enviar foto'}
          </Button>
        )}
      </FileButton>

      {value ? (
        <Text
          size="xs"
          c="dimmed"
          className="cursor-pointer underline"
          onClick={() => onChange('')}
        >
          Remover
        </Text>
      ) : null}
    </Group>
  );
}
