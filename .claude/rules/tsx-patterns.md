# Padrões JSX/TSX obrigatórios

## Extensão de arquivo

Arquivos de tela e componentes React devem ser **`.tsx`**. Nunca use `.jsx`.

---

## Regra 1 — Atributos em linhas separadas

Tags JSX com **mais de um atributo** devem ter cada atributo em sua própria linha.
O fechamento `>` ou `/>` também vai em linha própria.

```tsx
{/* ✅ Correto */}
<aside
  className="hidden lg:flex"
  style={{ background: 'red' }}
>

<img
  src="/logo.svg"
  alt="Logo"
  className="w-12 h-12"
/>

<Button
  type="submit"
  label="Entrar"
  loading={loading}
/>

{/* ✅ Exceção: único atributo sem conteúdo de texto pode ficar em linha única */}
<div className="container"></div>

{/* ❌ Errado */}
<img src="/logo.svg" alt="Logo" className="w-12" />
<Button type="submit" label="Entrar" loading={loading} />
```

---

## Regra 2 — Texto sempre em linha própria

Quando uma tag contém texto, o texto deve ficar em uma linha separada — nunca inline com a abertura ou o fechamento da tag.

```tsx
{/* ✅ Correto */}
<h2>
  Bem-vindo!
</h2>

<p>
  Selecione seu perfil e faça login no portal.
</p>

<span className="text-sm">
  Esqueci minha senha
</span>

<Button type="submit">
  Entrar no Portal
</Button>

{/* ❌ Errado */}
<h2>Bem-vindo!</h2>
<p>Selecione seu perfil e faça login no portal.</p>
<span className="text-sm">Esqueci minha senha</span>
<Button type="submit">Entrar no Portal</Button>
```

---

## Regra 3 — Linha em branco entre nós irmãos

Elementos no mesmo nível (siblings) devem ter **uma linha em branco** entre eles.
Nunca inserir linha em branco logo após a tag de abertura do pai nem logo antes da tag de fechamento do pai.

```tsx
{/* ✅ Correto */}
<div className="container">
  <h2>
    Título
  </h2>

  <p>
    Parágrafo
  </p>
</div>

<div className="outro">
  <span>
    Texto
  </span>
</div>

{/* ❌ Errado: linha em branco entre pai e filho */}
<div className="container">

  <h2>
    Título
  </h2>

  <p>
    Parágrafo
  </p>

</div>
```
