# Fernando Parise — Instrutor de Tiro

Site estático (HTML + CSS + JavaScript puro). Não precisa de build nem de servidor.

## Arquivos

- `index.html`: conteúdo da página
- `style.css`: visual e responsividade
- `script.js`: menu mobile, abas e o desafio do alvo
- `favicon.svg`: ícone da aba
- `assets/`: coloque aqui a sua foto (`assets/foto.jpg`)

## Antes de publicar, preencha

Procure por `[` no `index.html`:

- `[NOME DO CLUBE]`, `[DURAÇÃO]` e `[VALOR]` (seção Treine comigo)
- A resposta de "Preciso ter arma ou CR?" e o "[Informe se o clube fornece.]"
- **Foto:** salve como `assets/foto.jpg` e, no `index.html`, descomente a linha `<img class="portrait__img" ...>` (logo abaixo do comentário "TROQUE PELA SUA FOTO"). Use um retrato vertical (4:5) de pelo menos 1000 px de altura.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub (ex.: `fernando-parise`).
2. Envie estes arquivos para a raiz do repositório (pelo GitHub Desktop, pelo site com "Add file → Upload files" ou por `git push`).
3. No repositório: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch `main`, pasta `/ (root)`, e clique em **Save**.
4. Em 1 ou 2 minutos o site fica no ar em `https://SEU-USUARIO.github.io/fernando-parise/`.

Para usar um domínio próprio (ex.: `fernandoparise.com.br`), configure em **Settings → Pages → Custom domain** e aponte o DNS para o GitHub.

## Testar no computador

Abra o `index.html` direto no navegador (duplo clique).
