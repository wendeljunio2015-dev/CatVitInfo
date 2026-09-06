# Painel administrativo em Deploy Preview

Para validar o painel administrativo em Deploy Previews do Netlify, configure as variaveis `ADMIN_PASSWORD` e `ADMIN_SESSION_SECRET` tambem no contexto `deploy-preview`.

Essas variaveis sao carregadas no momento do build/deploy. Depois de altera-las, gere um novo Deploy Preview para que as funcoes do Next.js recebam os valores atualizados.
