# Painel Revendedor - Instruções de Instalação

## 1. Configuração do Banco de Dados (Supabase)
Vá até o seu **Supabase Dashboard** -> **SQL Editor** e rode o script abaixo para criar a tabela de revendedores e vincular ao seu sistema de keys existente:

O arquivo está em: `migrations/create_resellers.sql`

## 2. Configurar Variáveis de Ambiente
Renomeie o arquivo `.env.local` e preencha com suas chaves do Supabase:
> **Nota:** Para o painel funcionar corretamente gerando keys e banindo usuários, você precisa da `SUPABASE_SERVICE_ROLE_KEY` (chave de admin) pois as tabelas provavelmente tem proteção (RLS).

## 3. Rodar Localmente
```bash
cd painel-revendedor
npm install
npm run dev
```
Acesse:
- Painel Revendedor: `http://localhost:3000` (Use a Key de Demo: `DEMO-123`)
- Admin (Kill Switch): `http://localhost:3000/admin/secret-dashboard`

## 4. Deploy na Vercel
1. Instale a Vercel CLI ou suba para o GitHub.
2. Importe a pasta `painel-revendedor` como raiz do projeto na Vercel.
3. Adicione as variáveis de ambiente (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) nas configurações da Vercel.
