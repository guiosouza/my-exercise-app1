Crie um projeto em React Native usando o framework EXPO. Esse projeto será usado para BUILDAR um APK que irei instalar no meu celular.

INTERFACE e UI - A interface dele deve ter uma UI moderna e bonita, com temática igual a UI do **ARMORED CORE VI FIRES OF RUBICON**. É uma interface com menus minimalistas e cortes finos. Use cores como: #141414 para foco de base do sistema escuro e cor secundária sendo a #AEFF6F.

A aplicativo terá as seguintes sessões/abas:

- Exercícios: aqui será onde irei executar os exercícios.
- Estatísticas: aqui terei gráficos mostrando minha evolução ao longo do tempo e recordes para cada exercício e etc.
- Ficha: aqui irei montar minha ficha escolhendo os exercícios para cada dia da semana e também poderei adicionar exercícios.
- Perfil: aqui coloque as estatísticas que achar mais importante e também opções de exportar e importar dados no dispositivo.

Inicialmente, neste aplicativo terei os seguintes exercícios para selecionar:

```jsx
function Exercises() {
  const exerciseOptions: ExerciseOption[] = [
    { label: "Flexão" },
    { label: "Flexão declinada (30°)" },
    { label: "Barra" },
    { label: "Abdominal" },
    { label: "Agachamento" },
    { label: "Agachamento (1 perna)" },
    { label: "Levantamento lateral (1 perna)" },
    { label: "Bícepes" },
    { label: "Rosca" },
    { label: "Rosca alternada" },
    { label: "Rosca direta" },
    { label: "Rosca concentrada" },
    { label: "Rosca martelo" },
    { label: "Trícepes" },
    { label: "Ombro - Elevação frontal (pronada)" },
    { label: "Ombro - Elevação frontal (neutra)" },
    { label: "Costas" },
    { label: "Antebraço" },
    { label: "Nádegas" },
    { label: "Elevação pélvica" },
    { label: "Remada unilateral neutra" },
    { label: "Crucifixo" },
    { label: "Supino" },
    { label: "Remada curvada neutra" }
  ];
```

Depois, se eu quiser, poderei adicionar mais exercícios na ABA de FICHA.

## ABA EXERCÍCIOS

---

Na aba de exercícios, funcionará assim: 

- Seleciono o exercício.
- Irá aparecer as informações do exercício (nome, descrição, imagem e video).
- Se não tiver imagem e vídeo, irá aparecer apenas as informações básicas (nome e descrição).
- Quanto de peso.
- Quantas repetições totais eu fiz.
- Quantas séries.
- Quantas repetições eu falhei ou fiz negativa.
- Tempo médio de descanso.
- Colocar em “Gravar”.

Vamos supor que fiz rosca direta com 40 repetições com tempo médio de descanso de 90 segundos e usando 10 KILOS. O dado no final gravado será algo assim:

```jsx
{
	exercise: "rosca direta",
	totalLoad: 400, // 400 KG
	totalReps: 40, 
	weightUsed: 10, // 10 KG
	date: "18/09/25 - 10:14",
	restTime: 90,
	repsFailed: 0,
    description: "Exercício de rosca direta",
    image: "https://www.omnicalculator.com/pt/health/exercicios/imagens/rosca-direta.jpg",
    video: "https://www.youtube.com/watch?v=1234567890",
}
```

Vamos agora supor que a pessoa deu falha o negativa em UMA REPETIÇÃO. Isso contaria como se a REPETIÇÃO contasse com 40% do valor dela. Assim ficaria:

```jsx
{
	exercise: "rosca direta",
	totalLoad: 394, // 394 KG
	totalReps: 40, 
	wightUsed: 10, // 10 KG
	date: "18/09/25 - 10:14",
	restTime: 90,
	repsFailed: 1,
    description: "Exercício de rosca direta",
    image: "https://www.omnicalculator.com/pt/health/exercicios/imagens/rosca-direta.jpg",
    video: "https://www.youtube.com/watch?v=1234567890",
}
```

## ABA ESTATÍSTICAS

---

Nesta aba, terei que selecionar o exercício. Ai mostrará gráficos. Esses gráficos usando medidas do “totalLoad” ao longo do tempo. 

Também terá CARDS com 20 maiores recordes meus naquele exercícios. Exemplo de CARD:

- Exercício - ROSCA DIRETA °1
- Imagem: "https://www.omnicalculator.com/pt/health/exercicios/imagens/rosca-direta.jpg"
- Total de carga: 404 KG
- Data: 18/09/2025
- Falhas: 1
- Repetições: 41
- Descanso: 90 segundos

A única variável que determina a posição do CARD é a CARGA TOTAL. Mas tem um porém: para entrar nesse RANK de TOP 20 o exercício não pode ter mais do que 4 séries e 2 minutos de descanso.

## ABA FICHA

---

Aqui poderei montar a minha ficha escolhendo:

- Exercício.
- Dia da semana para aquele exercício.
- Repetições daquele exercícios, por extensão, por exemplo: Rosca direta de 8 a 10 repetições.
- Quantidade de séries daquele exercício.
- Tempo de descanso.

Isso servirá apenas para meio visuais, pois na ABA exercício, quando eu for escolher o que fazer, lá embaixo terá a FICHA para eu ver. Cuidado com a visualização da ficha, pois ela deve ser uma tabela simples de visualizar. Não precisa colocar imagem e vídeo.

Aqui também poderei alterar os exercícios padrões ou adicionais mais alguns. Todos já pré-existentes possuem as seguintes propriedades:

- Nome
- Descrição
- Imagem
- Tempo de descanso (em segundos e já vem 80 por padrão)

Ao cadastrar um novo, terei os campos:
- Nome
- Descrição
- Imagem (upar imagem do dispositivo ou inserir link)
- Tempo de descanso (em segundos e já vem 80 por padrão)
- Vídeo (link do youtube)


## PERFIL

---

Quero o máximo de dados para eu ver do usuário (coloque o que achar legal). Também quero a opção de exportar dados e importar para não perder.

Inclua também a opção de limpar todos os dados (zerar tudo).


## BANCO DE DADOS

---

Use o SQ LITE.