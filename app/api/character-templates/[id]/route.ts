import { db } from '@/libs/db';
import { characterTemplates } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const templateId = Number(id);

    const deleted = await db
      .delete(characterTemplates)
      .where(eq(characterTemplates.id, templateId))
      .returning({ id: characterTemplates.id });

    if (deleted.length === 0) {
      return NextResponse.json({ success: false, message: { 'pt-br': 'Personagem salvo não encontrado.', 'es-mx': 'Personaje guardado no encontrado.', 'en-us': 'Saved character not found.' }, data: null }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: { 'pt-br': 'Personagem salvo removido.', 'es-mx': 'Personaje guardado eliminado.', 'en-us': 'Saved character removed.' },
      data: null,
    });
  } catch (e) {
    console.error(e);

    return NextResponse.json({ success: false, message: { 'pt-br': 'Erro ao remover o personagem salvo.', 'es-mx': 'Error al eliminar el personaje guardado.', 'en-us': 'Error removing saved character.' }, data: null }, { status: 500 });
  }
}
