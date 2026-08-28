// Distingue "Personagem" de "NPC" só no contexto de Personagens Salvos
// (`character_templates`) — a tabela `characters` em si não tem esse campo
// (uma ficha de NPC e de Personagem têm o mesmo formato de linha; a
// diferença é só qual formulário foi usado para criá-la). Ver
// `.claude/rules/table-concept.md`.
export enum ECharacterKind {
  CHARACTER = 'character',
  NPC = 'npc',
}
