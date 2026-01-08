## Serviço de Venda de Veículos

API responsável pela compra, listagem e controle de vendas de veículos, incluindo processamento de pagamento via webhook.

### Tecnologias

- Node.js, TypeScript, Express
- Prisma com SQLite
- Jest para testes automatizados

### Como rodar localmente

- Instale as dependências com `npm install`
- Configure `DATABASE_URL` e `INVENTORY_BASE_URL` em um arquivo `.env`
- Gere o cliente Prisma com `npm run prisma:generate`
- Crie a base e rode as migrações com `npm run prisma:migrate`
- Inicie a aplicação com `npm run dev`

### Testes

- Execute `npm test` para rodar os testes
- Execute `npm run coverage` para visualizar a cobertura (mínimo configurado de 80%)

