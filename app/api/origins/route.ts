import { db } from '@/libs/db';
import { origins } from '@/db/schema';
import type { IAttributeBonus } from '@/resources/character/models/RulesContent';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const rows = await db.select().from(origins).orderBy(origins.name);

    return NextResponse.json({
      success: true,
      message: { 'pt-br': 'Operação realizada com sucesso.', 'es-mx': 'Operación realizada con éxito.', 'en-us': 'Operation completed successfully.' },
      data: rows,
    });
  } catch (e) {
    console.error(e);

    return NextResponse.json({ success: false, message: { 'pt-br': 'Erro ao listar as origens.', 'es-mx': 'Error al listar los orígenes.', 'en-us': 'Error listing origins.' }, data: null }, { status: 500 });
  }
}

// Cria uma Origem customizada (ver "Criando sua Origem" no manual — o
// Mestre já decide uma única distribuição fixa dos +2 pontos de atributo,
// diferente das origens comuns que oferecem 2 alternativas). Sem checagem
// de Mestre — mesmo raciocínio de GET /api/classes: conteúdo de sistema,
// não de uma Mesa específica.
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const grantedProficiency = typeof body.granted_proficiency === 'string' ? body.granted_proficiency.trim() : '';
    const startingItems = typeof body.starting_items === 'string' ? body.starting_items.trim() : '';
    const startingMoney = typeof body.starting_money === 'string' ? body.starting_money.trim() : '';
    const attributeBonuses: IAttributeBonus[] = Array.isArray(body.attribute_bonuses) ? body.attribute_bonuses : [];

    if (!name || !grantedProficiency || attributeBonuses.length === 0) {
      return NextResponse.json({ success: false, message: { 'pt-br': 'Preencha nome, perícia e bônus de atributo.', 'es-mx': 'Completa nombre, pericia y bono de atributo.', 'en-us': 'Fill in name, proficiency and attribute bonus.' }, data: null }, { status: 422 });
    }

    const [origin] = await db.insert(origins).values({
      name,
      description,
      attribute_bonus_options: [attributeBonuses],
      granted_proficiency: grantedProficiency,
      proficiency_choice: null,
      starting_items: startingItems,
      starting_money: startingMoney,
      is_custom: true,
    }).returning();

    return NextResponse.json({
      success: true,
      message: { 'pt-br': 'Origem customizada criada com sucesso.', 'es-mx': 'Origen personalizado creado con éxito.', 'en-us': 'Custom origin created successfully.' },
      data: origin,
    }, { status: 201 });
  } catch (e) {
    console.error(e);

    return NextResponse.json({ success: false, message: { 'pt-br': 'Erro ao criar a origem.', 'es-mx': 'Error al crear el origen.', 'en-us': 'Error creating origin.' }, data: null }, { status: 500 });
  }
}
