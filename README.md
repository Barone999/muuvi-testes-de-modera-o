# Ritmo & Bem-Estar

Crie um app web mobile-first chamado "Muuvi": um app de treino de corrida para mulheres iniciantes que adapta as recomendações à fase do ciclo menstrual. Todo o texto do app deve estar em português do Brasil.

TOM
Acolhedor, motivador e sem pressão. Nada de linguagem de performance extrema ou de "queimar gordura". A mensagem é: respeitar o corpo e o ritmo de cada fase.

PALETA DE CORES (use exatamente estes valores)
- #F5EDE2: fundo principal
- #F8C9CB: cards e áreas de destaque suaves
- #E8A092: botões principais e elementos de ação
- #DDE8D8: cards secundários, tags e estados de sucesso
- #B88B65: detalhes, ícones e acentos
- #383D35: texto principal
- #242723: títulos, barra de navegação e elementos de maior contraste
Visual: moderno e leve, cantos bem arredondados, bastante espaço em branco, fonte limpa e arredondada, sensação de bem-estar e feminilidade sem ser infantil.

NAVEGAÇÃO INFERIOR
Início, Treinos, Ciclo, Receitas, Comunidade (e Perfil acessível pelo topo).

TELAS E FUNCIONALIDADES
1. Onboarding: objetivo (começar a correr, criar disciplina, bem-estar), dias de treino por semana (2, 3 ou 4), nível atual (nunca corri / já tentei antes) e dados do ciclo (data da última menstruação, duração média do ciclo e da menstruação). Deixe claro que ela pode pular a parte do ciclo.
2. Início: fase atual do ciclo em destaque (com o dia do ciclo), treino recomendado para hoje com botão "Começar", receita sugerida e frase motivacional curta.
3. Ciclo (calendário visual completo): calendário mensal colorido por fase (menstrual, folicular, ovulatória e lútea), com marcação dos treinos feitos e previsão das próximas fases. Ao tocar em um dia, mostrar a fase, como o corpo pode estar se sentindo e a recomendação de treino. Permitir registrar a data de início da menstruação e como ela se sentiu no dia (energia, humor, sintomas).
4. Recomendações dinâmicas: o app sugere a intensidade e o tipo de treino conforme a fase (ex.: fase menstrual = caminhada leve ou treino curto e opcional; folicular = mais energia, bom momento para progredir; ovulatória = pico de energia; lútea = reduzir a intensidade gradualmente e priorizar o conforto). Sempre apresentar como sugestão, nunca como regra, com opção de ela escolher outro treino.
5. Treinos: programa de 8 semanas alternando caminhada e corrida (ex.: semana 1 = 1 min correndo + 2 min caminhando, repetido), com semanas concluídas e bloqueadas.
6. Treino ativo: cronômetro com contagem regressiva por intervalo, indicação grande de "CORRA" ou "CAMINHE", barra de progresso, botões de pausar e finalizar.
7. Treino concluído: tela de comemoração e opção de marcar como se sentiu (ótimo, ok, difícil).
8. Receitas: biblioteca de receitas de pré-treino e pós-treino, com filtros por momento (pré/pós), tempo de preparo e fase do ciclo. Cada receita tem foto, ingredientes, modo de preparo e opção de favoritar.
9. Comunidade: feed onde as usuárias publicam fotos e relatos das suas experiências, com curtidas, comentários, upload de imagem e opção de denunciar publicações. Tom positivo e de apoio.
10. Progresso e Perfil: sequência de dias, total de minutos, treinos concluídos e ajustes da conta.

BACKEND
- Login com e-mail usando Supabase (autenticação, banco de dados e armazenamento de imagens).
- Salvar por usuária: treinos concluídos, dados do ciclo, favoritos e publicações.
- Os dados do ciclo são sensíveis: devem ser privados, visíveis apenas para a própria usuária, e nunca aparecer no feed da comunidade.

AVISO
Incluir nos ajustes e no onboarding um aviso curto: as recomendações são informativas e não substituem orientação médica.

COMO COMEÇAR
Construa primeiro: onboarding, tela de Início, calendário do Ciclo e tela de treino ativo, com dados de exemplo. Depois deixe prontas as demais telas (Receitas e Comunidade) com conteúdo de exemplo, para eu ir refinando.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1dc180c8-8c11-4ccc-8890-c4c8e15196c7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
