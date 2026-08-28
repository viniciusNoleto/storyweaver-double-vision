import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

// Upload de foto de personagem — arquivo salvo em disco
// (`public/uploads/characters/`), só o caminho é persistido no banco (na
// coluna `image_url`, que já era uma string livre — sem mudança de schema).
// Ver `.claude/rules/table-concept.md` para o histórico da decisão (arquivo
// em disco em vez de bytes no Postgres).
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'characters');
const ALLOWED_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(request: Request) {
  try {
    const formData = await request.formData().catch(() => null);
    const file = formData?.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, message: { 'pt-br': 'Nenhum arquivo enviado.', 'es-mx': 'Ningún archivo enviado.', 'en-us': 'No file sent.' }, data: null }, { status: 422 });
    }

    const extension = ALLOWED_TYPES[file.type];

    if (!extension) {
      return NextResponse.json({ success: false, message: { 'pt-br': 'Formato de imagem não suportado. Use PNG, JPG, WEBP ou GIF.', 'es-mx': 'Formato de imagen no compatible. Usa PNG, JPG, WEBP o GIF.', 'en-us': 'Unsupported image format. Use PNG, JPG, WEBP or GIF.' }, data: null }, { status: 422 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ success: false, message: { 'pt-br': 'Imagem muito grande (máximo 5MB).', 'es-mx': 'Imagen demasiado grande (máximo 5MB).', 'en-us': 'Image too large (5MB max).' }, data: null }, { status: 422 });
    }

    await mkdir(UPLOAD_DIR, { recursive: true });

    const fileName = `${randomUUID()}.${extension}`;
    const bytes = Buffer.from(await file.arrayBuffer());

    await writeFile(path.join(UPLOAD_DIR, fileName), bytes);

    return NextResponse.json({
      success: true,
      message: { 'pt-br': 'Imagem enviada com sucesso.', 'es-mx': 'Imagen enviada con éxito.', 'en-us': 'Image uploaded successfully.' },
      data: { url: `/uploads/characters/${fileName}` },
    }, { status: 201 });
  } catch (e) {
    console.error(e);

    return NextResponse.json({ success: false, message: { 'pt-br': 'Erro ao enviar a imagem.', 'es-mx': 'Error al enviar la imagen.', 'en-us': 'Error uploading image.' }, data: null }, { status: 500 });
  }
}
