# LKL - Licensing Kernel Login Panel

Painel administrativo para gerenciamento de licenças de software com tema "Dark Hacker".

## Funcionalidades

- **Dashboard em Tempo Real**: Visualização de chaves, status e usuários.
- **Gerador de Keys**: Criação de licenças com durações variadas (Diário, Semanal, Mensal, Vitalício).
- **Sistema de Trava de IP (IP Lock)**: A chave é vinculada ao IP do primeiro uso.
- **Integração Supabase**: Banco de dados PostgreSQL para persistência segura.
- **Interface Cyberpunk**: Design responsivo com Glassmorphism e Neon.

## Como Usar

1.  Clone este repositório.
2.  Configure seu projeto no [Supabase](https://supabase.com).
3.  Rode o script `schema.sql` no SQL Editor do Supabase para criar a tabela.
4.  Edite o `index.html` e insira suas credenciais (`SUPABASE_URL` e `SUPABASE_KEY`).
5.  Abra o `index.html` no navegador ou faça deploy na Vercel.

## Deploy na Vercel

1.  Faça o push deste código para o GitHub.
2.  Acesse [Vercel.com](https://vercel.com) e importe o repositório.
3.  O deploy será automático (site estático).

## Tecnologias

- HTML5
- TailwindCSS (CDN)
- JavaScript (Vanilla)
- Supabase (Backend/DB)
