# CatVitInfo

Catálogo online da Vitória Informática LTDA., em Goiânia - GO.

## Recursos atuais

- Home responsiva
- Catálogo com busca e filtro por categoria
- Página individual de produto
- Carrinho com persistência no navegador
- Quantidade, remoção e total do carrinho
- Orçamento completo pelo WhatsApp
- Status de estoque, preço, categoria, destaque e garantia por produto
- Estrutura preparada para imagens dos produtos
- Configuração para deploy no Netlify

## Tecnologias

- Next.js
- React
- TypeScript
- Tailwind CSS

## Desenvolvimento local

```bash
npm install
npm run dev
```

Abra `http://localhost:3000` no navegador.

## Publicação no Netlify

1. Conecte este repositório ao Netlify.
2. O framework Next.js deve ser detectado automaticamente.
3. Use `npm run build` como comando de build e `.next` como diretório de publicação, caso o Netlify não preencha automaticamente.
4. Publique o site.

## Produtos

Os produtos ficam centralizados em `data/products.ts` e usam o tipo definido em `types/product.ts`.

Para adicionar uma foto, salve o arquivo na pasta `public/products/` e informe no produto, por exemplo:

```ts
image: "/products/intel-core-i5-10600k.jpg"
```

Não cadastrar garantias sem confirmação. O atendimento e a disponibilidade de entrega devem ser consultados para Goiânia - GO.
