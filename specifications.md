Estou criando um `App EXPO React Native`. Ele será um aplicativo `Android` para registrar meus exercícios de musculação. Ele terá estas abas:

## Exercícios

---

Nesta aba terei uma listagem de todos exercícios. Ao escolher um exercício, irei preencher um formulário com:

```markdown
- Quantas repetições completas
- Quantas repetições negativas (só excêntricas)
- Quantas repetições falharam na concêntrica
- Quantas séries
- Peso utilizado (kg)
- Tempo de descanso (padrão: 80s)
```

`Observação`: séries com repetições negativas valem 60% de uma série completa e com falha concêntrica vale 40%.

Ao colocar em “Gravar sessão”, será gravado uma “sessão de treino”. Que ficará algo assim:

```markdown
- peso total levantado
- data (com horas também)
- tempo de descanso
- repetições
- séries 
```

Ao clicar em um exercício, um FORM será aberto. Antes dos campos terá um LINK que poderei clicar e ver o vídeo no `YouTube` de exemplo. Claro, esse LINK só aparecerá se eu tiver colocado ele na hora da criação ou edição do exercício. 

Outra informação que terá que é lá embaixo antes de eu gravar, terá o quanto de carga total estarei gravando se caso eu clicar em “Gravar Sessão”.

## Edição

---

Aqui será onde irei criar exercícios novos, editar ou deletar. No FORM de criação deve ter:

```markdown
- Título
- Descrição
- Se é peso normal ou peso corporal
- Se for peso corporal quantos por cento cada repetição equivale do peso
- Link do YouTube (opcional)
- Link da imagem ou mesmo carregar do dispositivo (opcional)
```

Como funciona o peso corporal que falei acima: vamos supor que criei o exercício “Flexão” e coloquei que é do tipo `peso corporal` e que equivale a 70% do peso. Se caso, por exemplo, eu gravar uma sessão de 2 flexões e coloquei 100 KILOS no peso levantando, então o cálculo será:

```markdown
 - (70% de 100) * 2 = 140 KILOS
```

## Estatísticas

---

Esta aba é feita para eu ver meu progresso. Nela irei escolher um dos exercícios e um `intervalo de datas` . Esse intervalo de datas terá as opções:

```markdown
- De hoje até 7 dias atrás
- De hoje até 30 dias atrás
- De hoje até 90 dias atrás
- Personalizado (escolher datas)
```

Depois de escolhida as datas, então irá mostrar:

1. Um CARD com informações de progresso deste exercício selecionado.
2. Listagem dos TOPS registros de sessões deste exercício selecionado (escolho a quantidade).

### 1 - CARD de progresso

---

O CARD com informações de progresso terá algo assim: vamos supor, por exemplo, que eu selecionei o período de `“Últimos 7 dias”`. Durante esse período, comecei com uma sessão de `total de carga` de 140 KILOS e terminei com 280 KILOS na última sessão gravada. Neste caso, eu terei um CARD de progresso assim:

```markdown
- Evolução: 100.000% (se for positiva fica verde, se for negativa fica vermelho)
- Começou com carga total: 140 KILOS (data da primeira sessão)
- Terminou com carga total: 280 KILOS (data da última sessão)
```

### 2 - Listagem dos TOPS

---

Aqui irá ficar uma listagem com as sessões por ordem de `carga total puxada`. Por exemplo:

```markdown
# 1
- Exercício: Flexão
- Carga total: 280 KILOS
- Data: 05/10/2025 às 17:00
- Repetições: 2
- Séries: 2
```

```markdown
# 2
- Exercício: Flexão
- Carga total: 140 KILOS
- Data: 03/10/2025 às 17:33
- Repetições: 2
- Séries: 2
```

```markdown
# 3
- Exercício: Flexão
- Carga total: 120 KILOS
- Data: 01/10/2025 às 17:36
- Repetições: 2
- Séries: 2
```

Cada um desses “CARDS” eu posso editar ou deletar ou seja, no fundo estou deletando ou editando uma `sessão gravada`.