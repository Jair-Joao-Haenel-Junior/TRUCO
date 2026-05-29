# Contador de Pontos Web com Google Sheets

Este projeto grava as partidas em uma planilha do Google Sheets usando Google Apps Script.

## Arquivos

- `index.html`: tela do app.
- `styles.css`: estilos do app.
- `script.js`: lógica do contador e envio da partida.
- `apps-script.gs`: código que deve ser colado no Google Apps Script.

## Estrutura gravada na planilha

Aba `Partida`:

| ID | Data | Tipo | Time_vencedor |
|---|---|---|---|

Aba `Times`:

| ID | Id_partida | Nomes | Time | Pontos |
|---|---|---|---|---|

## Como configurar o Google Sheets

1. Crie uma planilha no Google Sheets.
2. Abra a planilha.
3. Clique em `Extensões > Apps Script`.
4. Apague o código padrão e cole o conteúdo do arquivo `apps-script.gs`.
5. Salve o projeto.
6. Clique em `Implantar > Nova implantação`.
7. Escolha o tipo `App da Web`.
8. Em `Executar como`, selecione `Eu`.
9. Em `Quem pode acessar`, selecione `Qualquer pessoa`.
10. Clique em `Implantar`.
11. Copie a URL terminada em `/exec`.
12. Abra o `index.html` no navegador.
13. Na tela inicial, abra `Configurar gravação no Google Sheets` e cole a URL.
14. Clique em `Salvar URL`.

## Como usar

1. Escolha Individual, Dupla ou Trio.
2. Informe os participantes.
3. Clique em `Começar partida`.
4. Marque os pontos normalmente.
5. Clique em `Terminar Partida`.
6. Se houver vencedor, a partida será enviada para a planilha.

## Observação importante

O navegador pode não conseguir ler a resposta do Google Apps Script por causa de CORS. Por isso, o app usa envio em modo `no-cors`.

Na prática: ao clicar em `Terminar Partida`, o app envia os dados para o Apps Script, mas a confirmação real deve ser conferida na planilha.
