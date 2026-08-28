import { config } from 'dotenv';

config({ path: '.env' });

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { classes, species, origins } from '../schema';
import { EAttribute } from '../../resources/character/enums/Attribute';

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

const db = drizzle(pool);

const A = EAttribute;

async function seedClasses() {
  const rows = [
    {
      name: 'Bárbaro',
      description: 'Bárbaros são combatentes de poder avassalador, impulsionados por forças primitivas do multiverso que se manifestam através de sua Fúria.',
      primary_attributes: [A.FORCA],
      attribute_bonuses: [
        { attribute: A.FORCA, amount: 2 },
        { attribute: A.CONSTITUICAO, amount: 1 },
        { attribute: A.DESTREZA, amount: 1 },
        { attribute: A.SABEDORIA, amount: -1 },
        { attribute: A.INTELIGENCIA, amount: -1 },
      ],
      skill_proficiency_choice: { count: 3, options: ['Acrobacia', 'Adestramento', 'Intimidação', 'Intuição', 'Percepção'] },
      knowledge_proficiency_choice: null,
      equipment_choice: { options: [{ label: 'A', description: 'Uma arma de curto alcance de duas mãos' }, { label: 'B', description: 'Duas armas de curto alcance de uma mão' }] },
      fixed_equipment: null,
      hp_base: 8, mana_base: 0, evasion: 10,
      extra_resources: [{ label: 'Dano de curto alcance', value: '1d12' }, { label: 'Fúrias', value: '1' }, { label: 'Força Extra', value: '1d4' }],
    },
    {
      name: 'Caçador',
      description: 'Caçadores são os olhos e o instinto do ermo selvagem, aqueles que aprenderam a se mover sem deixar rastro e a golpear sem dar aviso.',
      primary_attributes: [A.SABEDORIA, A.DESTREZA],
      attribute_bonuses: [
        { attribute: A.DESTREZA, amount: 2 },
        { attribute: A.SABEDORIA, amount: 1 },
        { attribute: A.CONSTITUICAO, amount: 1 },
        { attribute: A.CARISMA, amount: -2 },
      ],
      skill_proficiency_choice: { count: 1, options: ['Acrobacia', 'Adestramento', 'Furtividade', 'Investigação', 'Intuição', 'Percepção'] },
      knowledge_proficiency_choice: { fixed: ['Animal'], count: 1, options: ['Botânico', 'Geológico', 'Navegação'] },
      equipment_choice: { options: [{ label: 'A', description: 'Uma arma de curto alcance' }, { label: 'B', description: 'Uma arma de médio alcance' }] },
      fixed_equipment: ['Uma arma de longo alcance', 'Um companheiro animal'],
      hp_base: 8, mana_base: 2, evasion: 9,
      extra_resources: [{ label: 'Magias conhecidas', value: '1' }, { label: 'Armadilhas', value: '1' }, { label: 'Dano curto/médio', value: '1d6' }, { label: 'Dano longo', value: '2d4' }, { label: 'Fera Mágica — Vida', value: '2' }, { label: 'Fera Mágica — Dano', value: '1d4' }],
    },
    {
      name: 'Cavaleiro',
      description: 'Cavaleiros são mais do que combatentes experientes: são a personificação de um código de honra que orienta cada escolha, dentro e fora do campo de batalha.',
      primary_attributes: [A.FORCA],
      attribute_bonuses: [
        { attribute: A.CONSTITUICAO, amount: 2 },
        { attribute: A.FORCA, amount: 1 },
        { attribute: A.DESTREZA, amount: 1 },
        { attribute: A.SORTE, amount: -2 },
      ],
      skill_proficiency_choice: { count: 3, options: ['Adestramento', 'Intimidação', 'Intuição', 'Investigação', 'Percepção', 'Pilotar', 'Simpatia'] },
      knowledge_proficiency_choice: null,
      equipment_choice: {
        options: [
          { label: 'A', description: 'Uma arma de curto alcance de duas mãos' },
          { label: 'B', description: 'Duas armas de curto alcance de uma mão' },
          { label: 'C', description: 'Uma arma de médio alcance de uma mão e escudo' },
          { label: 'D', description: 'Uma arma de longo alcance' },
        ],
      },
      fixed_equipment: null,
      hp_base: 10, mana_base: 0, evasion: 8,
      extra_resources: [{ label: 'Dano curto', value: '2d6' }, { label: 'Dano médio', value: '2d4' }, { label: 'Dano longo', value: '1d6' }, { label: 'Defesa de escudo', value: '+3:+3' }, { label: 'Recuperar Fôlego', value: '2 usos, d6' }],
    },
    {
      name: 'Clérigo',
      description: 'Clérigos são servos diretos do divino, indivíduos que canalizam a vontade de entidades superiores para o mundo mortal.',
      primary_attributes: [A.SABEDORIA],
      attribute_bonuses: [
        { attribute: A.SABEDORIA, amount: 2 },
        { attribute: A.CARISMA, amount: 1 },
        { attribute: A.INTELIGENCIA, amount: 1 },
        { attribute: A.CONSTITUICAO, amount: -2 },
      ],
      skill_proficiency_choice: { count: 1, options: ['Adestramento', 'Intimidação', 'Intuição', 'Investigação', 'Percepção', 'Simpatia'] },
      knowledge_proficiency_choice: { fixed: ['Religioso'], count: 1, options: ['Arcano', 'Médico', 'Político'] },
      equipment_choice: null,
      fixed_equipment: ['Um símbolo religioso'],
      hp_base: 6, mana_base: 4, evasion: 4,
      extra_resources: [{ label: 'Magias conhecidas', value: '4' }, { label: 'Dano de emissão', value: '1d4' }, { label: 'Marca Divina', value: '1 uso' }, { label: 'Toque da Compaixão', value: '1d12' }],
    },
    {
      name: 'Cozinheiro',
      description: 'O cozinheiro é a prova viva de que o poder não nasce apenas do aço, da fé ou da magia arcana — a preparação certa pode decidir o resultado de uma aventura.',
      primary_attributes: [A.SABEDORIA],
      attribute_bonuses: [
        { attribute: A.CARISMA, amount: 1 },
        { attribute: A.DESTREZA, amount: 1 },
        { attribute: A.FORCA, amount: 1 },
        { attribute: A.SABEDORIA, amount: 1 },
        { attribute: A.SORTE, amount: -1 },
        { attribute: A.INTELIGENCIA, amount: -1 },
      ],
      skill_proficiency_choice: { count: 2, options: ['Intimidação', 'Investigação', 'Persuasão', 'Prestidigitação', 'Simpatia'] },
      knowledge_proficiency_choice: { fixed: ['Culinária'], count: 0, options: [] },
      equipment_choice: null,
      fixed_equipment: ['Uma arma de curto alcance de uma mão', 'Uma bolsa de Cozinheiro', 'Utensílios de Cozinheiro'],
      hp_base: 6, mana_base: 4, evasion: 6,
      extra_resources: [{ label: 'Dano de curto alcance', value: '1d6' }, { label: 'Petiscos', value: '3' }],
    },
    {
      name: 'Druida',
      description: 'Druidas são guardiões do equilíbrio natural e reverentes da vida selvagem em todas as suas formas.',
      primary_attributes: [A.SABEDORIA],
      attribute_bonuses: [
        { attribute: A.SABEDORIA, amount: 2 },
        { attribute: A.CONSTITUICAO, amount: 1 },
        { attribute: A.DESTREZA, amount: 1 },
        { attribute: A.FORCA, amount: -2 },
      ],
      skill_proficiency_choice: null,
      knowledge_proficiency_choice: { fixed: ['Animal', 'Botânico'], count: 1, options: ['Arcano', 'Geológico', 'Médico'] },
      equipment_choice: null,
      fixed_equipment: ['Um condutor mágico', 'Uma bolsa para guardar ingredientes mágicos'],
      hp_base: 6, mana_base: 4, evasion: 4,
      extra_resources: [{ label: 'Magias conhecidas', value: '5' }, { label: 'Dano de magia (Leque)', value: '1d8' }, { label: 'Dano de magia (Granada)', value: '1d6' }],
    },
    {
      name: 'Feiticeiro',
      description: 'Feiticeiros manifestam magia de forma instintiva, mas raramente de maneira consciente logo no início de suas vidas.',
      primary_attributes: [A.SORTE],
      attribute_bonuses: [
        { attribute: A.SORTE, amount: 2 },
        { attribute: A.CARISMA, amount: 1 },
        { attribute: A.DESTREZA, amount: 1 },
        { attribute: A.CONSTITUICAO, amount: -1 },
        { attribute: A.FORCA, amount: -1 },
      ],
      skill_proficiency_choice: { count: 2, options: ['Intuição', 'Investigação', 'Percepção', 'Prestidigitação'] },
      knowledge_proficiency_choice: { fixed: ['Arcano'], count: 0, options: [] },
      equipment_choice: null,
      fixed_equipment: ['Um condutor mágico', 'Uma bolsa para guardar ingredientes mágicos'],
      hp_base: 4, mana_base: 3, evasion: 4,
      extra_resources: [{ label: 'Magias conhecidas', value: '3' }, { label: 'Tipagens', value: '1' }, { label: 'Dano de Toque', value: '1d10' }, { label: 'Dano de Emissão', value: '1d8' }, { label: 'Dano de Granada', value: '1d6' }, { label: 'Dado de Conjuração Forçada', value: '1d2' }],
    },
    {
      name: 'Ladino',
      description: 'Ladinos são mestres do movimento silencioso e da ação precisa — onde outros veem obstáculos, o Ladino enxerga rotas de fuga, esconderijos e oportunidades.',
      primary_attributes: [A.DESTREZA],
      attribute_bonuses: [
        { attribute: A.DESTREZA, amount: 3 },
        { attribute: A.SORTE, amount: 1 },
        { attribute: A.CONSTITUICAO, amount: -1 },
        { attribute: A.SABEDORIA, amount: -1 },
      ],
      skill_proficiency_choice: { count: 3, options: ['Arcano', 'Acrobacia', 'Blefe', 'Botânico', 'Furtividade', 'Investigação', 'Navegação', 'Pilotar', 'Percepção', 'Prestidigitação'] },
      knowledge_proficiency_choice: null,
      equipment_choice: { options: [{ label: 'A', description: 'Dez armas de curto alcance de uma mão' }, { label: 'B', description: 'Uma arma de longo alcance' }] },
      fixed_equipment: ['Um kit de ferramentas de ladrão'],
      hp_base: 4, mana_base: 0, evasion: 12,
      extra_resources: [{ label: 'Dano de curto alcance', value: '2d4' }, { label: 'Dano de lançamento', value: '1d6' }, { label: 'Dano de longo alcance', value: '1d8' }, { label: 'Dado Furtivo', value: '1d4' }],
    },
    {
      name: 'Paladino',
      description: 'Paladinos são soldados da fé, guerreiros moldados por um voto sagrado que se sobrepõe a qualquer desejo pessoal.',
      primary_attributes: [A.CARISMA, A.FORCA],
      attribute_bonuses: [
        { attribute: A.CARISMA, amount: 2 },
        { attribute: A.FORCA, amount: 2 },
        { attribute: A.DESTREZA, amount: -1 },
        { attribute: A.SABEDORIA, amount: -1 },
      ],
      skill_proficiency_choice: { count: 2, options: ['Adestramento', 'Intuição', 'Intimidação', 'Percepção', 'Pilotar', 'Simpatia'] },
      knowledge_proficiency_choice: { fixed: ['Religioso'], count: 0, options: [] },
      equipment_choice: null,
      fixed_equipment: ['Um símbolo religioso', 'Uma arma de curto alcance'],
      hp_base: 8, mana_base: 1, evasion: 8,
      extra_resources: [{ label: 'Magias conhecidas', value: '1' }, { label: 'Dano de curto alcance', value: '2d4' }, { label: 'Mãos Consagradas', value: '2 usos' }],
    },
  ];

  await db.insert(classes).values(rows);
  console.log(`${rows.length} classes inseridas.`);
}

async function seedSpecies() {
  const rows = [
    {
      name: 'Anão',
      description: 'Os Anões são amplamente reconhecidos por sua tenacidade inabalável e por sua extraordinária capacidade de resistir aos rigores das condições mais hostis.',
      attribute_bonuses: [],
      racial_abilities: [
        { name: 'Resistência Anã', description: 'Anões não possuem restrições para descansar, suportando longos períodos de esforço sem prejuízo à recuperação.' },
        { name: 'Visão Noturna', description: 'Anões possuem visão noturna nítida em até 6 metros, permitindo que enxerguem em ambientes de baixa luminosidade.' },
        { name: 'Sangue de pedra', description: 'Anões recebem +1d6 de Esperança em testes para resistir a venenos e toxinas.' },
      ],
    },
    {
      name: 'Draconato',
      description: 'Os draconatos são um povo profundamente marcado pelo valor da linhagem — a identidade de um indivíduo se estende por gerações.',
      attribute_bonuses: [],
      racial_abilities: [
        { name: 'Auxílio Ancestral', description: 'Draconatos podem repetir qualquer teste falho pelo custo de 4 pontos de Esperança e adicionar 2 pontos de Medo, uma vez por descanso curto.' },
        { name: 'Aviso do Além', description: 'Draconatos recebem +1d4 de Esperança contra efeitos negativos de surpresa, como armadilhas ou emboscadas.' },
      ],
    },
    {
      name: 'Elfo',
      description: 'Os elfos são seres profundamente ligados à natureza, mantendo com ela uma relação íntima que vai além da simples coexistência.',
      attribute_bonuses: [],
      racial_abilities: [
        { name: 'Passos Leves', description: 'Elfos podem se locomover livremente em qualquer terreno não mágico dificultado pelo peso (neve fofa, gelo fino, lama profunda, areia movediça), sem sofrer penalidades de movimento.' },
        { name: 'Equilíbrio Natural', description: 'Elfos raramente perdem o equilíbrio, recebendo +1d6 de Esperança contra quedas e escorregões.' },
        { name: 'Olhos das Copas', description: 'Elfos possuem visão diurna nítida em 60 metros.' },
      ],
    },
    {
      name: 'Firbolg',
      description: 'Os firbolgs vivem segundo o princípio da simplicidade consciente — o silêncio ocupa um papel central em sua cultura.',
      attribute_bonuses: [],
      racial_abilities: [
        { name: 'Pesados como a Rocha', description: 'Firbolgs recebem +1d6 de Esperança em testes para resistir a ser empurrado ou derrubado.' },
        { name: 'Silêncio Observador', description: 'Após passar um turno sem atacar, conjurar, falar ou mover-se, os firbolgs recebem +1d4 de Esperança em percepção.' },
        { name: 'Respiração Mineral', description: 'Firbolgs precisam de menos comida, água e ar, podendo sobreviver em ambientes hostis por mais tempo.' },
      ],
    },
    {
      name: 'Hobbit',
      description: 'Os Hobbits são amplamente conhecidos por seu espírito festeiro e por seu amor genuíno pelas boas celebrações.',
      attribute_bonuses: [],
      racial_abilities: [
        { name: 'Sorte Inesperada', description: 'Hobbits podem repetir um teste envolvendo Sorte cinco vezes por descanso curto.' },
        { name: 'Esperança Inabalável', description: 'Hobbits recebem +1d6 de Esperança em testes para resistir a efeitos de medo.' },
        { name: 'Ânimo Contagiante', description: 'Hobbits recebem +1d6 de Esperança em testes sociais voltados a aliviar tensões, acalmar conflitos ou restaurar a moral do grupo.' },
      ],
    },
    {
      name: 'Humano',
      description: 'Os humanos são movidos por uma ambição constante — para eles, o mundo não é um campo fixo, mas um campo de possibilidades a ser explorado.',
      attribute_bonuses: [],
      racial_abilities: [
        { name: 'Aprendendo com os erros', description: 'Fora de combate, ao falhar em um teste, humanos recebem +1d4 de Esperança no próximo teste que fizerem da mesma habilidade.' },
        { name: 'Improviso', description: 'Humanos podem gastar 4 horas para fazer uma versão improvisada de uma ferramenta que tenham conhecimento de como usar.' },
        { name: 'Ousadia', description: 'Humanos podem, 3 vezes por descanso curto, declarar uma ação como ousada, mudando o valor de pontos adquiridos na rolagem (sucesso crítico: 4 Esperança; sucesso com Esperança: 2 Esperança; falha com Esperança: 1 Esperança; sucesso com Medo: 2 Medo; falha crítica: 4 Medo).' },
      ],
    },
    {
      name: 'Orc',
      description: 'A sociedade orc é fortemente estruturada em torno do valor do trabalho — o coletivo sempre prevalece sobre o indivíduo.',
      attribute_bonuses: [],
      racial_abilities: [
        { name: 'Dedicação ao Ofício', description: 'Ao criar o personagem, o orc pode escolher uma ferramenta adicional em sua origem.' },
        { name: 'Visão Prática', description: 'Orcs possuem visão diurna apenas em tons de cinza e visão noturna de 20 metros em tons de cinza.' },
        { name: 'Força do Coletivo', description: 'Orcs recebem +1d4 de Esperança em testes para fazer ações colaborativas em que possuam perícia.' },
      ],
    },
    {
      name: 'Tiefling',
      description: 'Tieflings possuem uma aparência inconfundível, marcada por traços que destoam do comum entre os povos sencientes.',
      attribute_bonuses: [],
      racial_abilities: [
        { name: 'Cauda Preênsil', description: 'Tieflings possuem controle pleno de sua cauda, capazes de usá-la para segurar, sustentar ou operar objetos simples (tocha, alavancas, pequenos objetos) enquanto as mãos permanecem livres.' },
        { name: 'Resiliência ao Julgamento', description: 'Tieflings recebem +1d4 de Esperança em testes para resistir a efeitos de medo.' },
        { name: 'Olhar do Deslocado', description: 'Tieflings recebem +1d4 de Esperança em testes de percepção social (identificar mentiras, tensões ou intenções ocultas).' },
      ],
    },
  ];

  await db.insert(species).values(rows);
  console.log(`${rows.length} espécies inseridas.`);
}

async function seedOrigins() {
  const rows = [
    {
      name: 'Filho da Oficina',
      description: 'Criado entre bancadas, ferramentas e o som constante do trabalho manual, você aprendeu cedo o valor da paciência e da precisão.',
      attribute_bonus_options: [[{ attribute: A.DESTREZA, amount: 2 }], [{ attribute: A.DESTREZA, amount: 1 }, { attribute: A.INTELIGENCIA, amount: 1 }]],
      granted_proficiency: null,
      proficiency_choice: { options: ['Ferramentas (carpinteiro)', 'Ferramentas (ferreiro)', 'Ferramentas (couro)', 'Ferramentas (oleiro)'] },
      starting_items: 'Conjunto simples de ferramentas do ofício, avental resistente',
      starting_money: '12 cg',
    },
    {
      name: 'Criado nas Ruas',
      description: 'Você aprendeu a sobreviver onde a lei raramente alcança. Observação, esperteza e oportunismo foram suas maiores armas.',
      attribute_bonus_options: [[{ attribute: A.DESTREZA, amount: 2 }], [{ attribute: A.DESTREZA, amount: 1 }, { attribute: A.CARISMA, amount: 1 }]],
      granted_proficiency: null,
      proficiency_choice: { options: ['Blefe', 'Furtividade'] },
      starting_items: 'Manto surrado com bolsos ocultos, pequena faca ou ferramenta improvisada',
      starting_money: '15 cg',
    },
    {
      name: 'Devoto do Altar',
      description: 'Sua vida sempre girou em torno de templos, rituais e preces. Mesmo longe da fé formal, os ensinamentos ainda ecoam em suas ações.',
      attribute_bonus_options: [[{ attribute: A.SABEDORIA, amount: 2 }], [{ attribute: A.SABEDORIA, amount: 1 }, { attribute: A.CARISMA, amount: 1 }]],
      granted_proficiency: 'Conhecimento religioso',
      proficiency_choice: null,
      starting_items: 'Símbolo religioso simples, livro de orações ou hinos',
      starting_money: '10 cg',
    },
    {
      name: 'Aprendiz de Erudito',
      description: 'Passou anos cercado de livros, mapas e debates acadêmicos. Mesmo que o mundo real seja mais caótico, você sabe onde procurar respostas.',
      attribute_bonus_options: [[{ attribute: A.INTELIGENCIA, amount: 2 }], [{ attribute: A.INTELIGENCIA, amount: 1 }, { attribute: A.SABEDORIA, amount: 1 }]],
      granted_proficiency: null,
      proficiency_choice: { options: ['Conhecimento arcano', 'Conhecimento botânico', 'Conhecimento político'] },
      starting_items: 'Caderno de anotações, tinteiro e pena',
      starting_money: '8 cg',
    },
    {
      name: 'Filho do Campo',
      description: 'A terra foi sua professora. Plantar, colher e observar os ciclos da natureza moldaram sua visão de mundo.',
      attribute_bonus_options: [[{ attribute: A.CONSTITUICAO, amount: 2 }], [{ attribute: A.CONSTITUICAO, amount: 1 }, { attribute: A.SABEDORIA, amount: 1 }]],
      granted_proficiency: 'Conhecimento animal',
      proficiency_choice: null,
      starting_items: 'Ferramenta agrícola simples, saco de sementes variadas',
      starting_money: '10 cg',
    },
    {
      name: 'Artista Itinerante',
      description: 'Sua vida foi uma sucessão de estradas, palcos improvisados e histórias trocadas por abrigo e comida.',
      attribute_bonus_options: [[{ attribute: A.CARISMA, amount: 2 }], [{ attribute: A.CARISMA, amount: 1 }, { attribute: A.DESTREZA, amount: 1 }]],
      granted_proficiency: null,
      proficiency_choice: { options: ['Persuasão', 'Simpatia'] },
      starting_items: 'Instrumento musical simples ou material artístico',
      starting_money: '18 cg',
    },
    {
      name: 'Sobrevivente de Conflito',
      description: 'Você cresceu em meio a batalhas, ocupações ou rebeliões. A violência deixou marcas, mas também ensinou a resistir.',
      attribute_bonus_options: [[{ attribute: A.CONSTITUICAO, amount: 2 }], [{ attribute: A.CONSTITUICAO, amount: 1 }, { attribute: A.FORCA, amount: 1 }]],
      granted_proficiency: 'Intimidação',
      proficiency_choice: null,
      starting_items: 'Símbolo quebrado de uma facção ou exército, lembrança de um aliado',
      starting_money: '14 cg',
    },
    {
      name: 'Herdeiro de um Nome',
      description: 'Você nasceu carregando expectativas. Seja uma família respeitada ou infame, o peso do nome ainda o acompanha.',
      attribute_bonus_options: [[{ attribute: A.SORTE, amount: 2 }], [{ attribute: A.CARISMA, amount: 1 }, { attribute: A.SORTE, amount: 1 }]],
      granted_proficiency: null,
      proficiency_choice: { options: ['Blefe', 'Persuasão'] },
      starting_items: 'Anel, broche ou documento que prova sua linhagem',
      starting_money: '20 cg',
    },
  ];

  await db.insert(origins).values(rows);
  console.log(`${rows.length} origens inseridas.`);
}

// Idempotente: só popula se as tabelas estiverem vazias — seguro rodar mais
// de uma vez (ex: depois de recriar o banco local).
async function main() {
  const [existingClasses] = await db.select({ id: classes.id }).from(classes).limit(1);
  const [existingSpecies] = await db.select({ id: species.id }).from(species).limit(1);
  const [existingOrigins] = await db.select({ id: origins.id }).from(origins).limit(1);

  if (!existingClasses) await seedClasses(); else console.log('classes já populada, pulando.');
  if (!existingSpecies) await seedSpecies(); else console.log('species já populada, pulando.');
  if (!existingOrigins) await seedOrigins(); else console.log('origins já populada, pulando.');

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
