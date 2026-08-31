import { db } from '@/libs/db';
import { characterTemplates } from '@/db/schema';
import { ECharacterKind } from '@/resources/character/enums/CharacterKind';
import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

// Lista/cria Personagens Salvos (ver `.claude/rules/table-concept.md`) —
// globais, não pertencem a nenhuma Mesa, então sem checagem de Mestre (mesmo
// raciocínio já usado em `GET /api/tables`: app de uso pessoal, um único
// dono).
export async function GET(request: Request) {
  try {
    const kind = new URL(request.url).searchParams.get('kind');

    const rows = kind
      ? await db.select().from(characterTemplates).where(eq(characterTemplates.kind, kind)).orderBy(desc(characterTemplates.created_at))
      : await db.select().from(characterTemplates).orderBy(desc(characterTemplates.created_at));

    return NextResponse.json({
      success: true,
      message: { 'pt-br': 'Operação realizada com sucesso.', 'es-mx': 'Operación realizada con éxito.', 'en-us': 'Operation completed successfully.' },
      data: rows,
    });
  } catch (e) {
    console.error(e);

    return NextResponse.json({ success: false, message: { 'pt-br': 'Erro ao listar os personagens salvos.', 'es-mx': 'Error al listar los personajes guardados.', 'en-us': 'Error listing saved characters.' }, data: null }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const kind = body.kind === ECharacterKind.NPC ? ECharacterKind.NPC : ECharacterKind.CHARACTER;

    if (!name) {
      return NextResponse.json({ success: false, message: { 'pt-br': 'Informe o nome do personagem.', 'es-mx': 'Ingresa el nombre del personaje.', 'en-us': 'Enter the character name.' }, data: null }, { status: 422 });
    }

    const [template] = await db.insert(characterTemplates).values({
      kind,
      name,
      image_url: typeof body.image_url === 'string' ? body.image_url : null,
      hp_max: typeof body.hp_max === 'number' ? body.hp_max : 1,
      has_mana: typeof body.has_mana === 'boolean' ? body.has_mana : false,
      mana_max: typeof body.mana_max === 'number' ? body.mana_max : 0,
      created_at: new Date(),
    }).returning();

    return NextResponse.json({
      success: true,
      message: { 'pt-br': 'Personagem salvo para reutilização futura.', 'es-mx': 'Personaje guardado para uso futuro.', 'en-us': 'Character saved for future reuse.' },
      data: template,
    }, { status: 201 });
  } catch (e) {
    console.error(e);

    return NextResponse.json({ success: false, message: { 'pt-br': 'Erro ao salvar o personagem.', 'es-mx': 'Error al guardar el personaje.', 'en-us': 'Error saving character.' }, data: null }, { status: 500 });
  }
}
