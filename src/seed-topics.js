// Textos das páginas de tópicos (fornecidos pelo canil). Editáveis no painel, aba Conteúdo.
const { SECTIONS } = require('./seed-content');
const body = slug => SECTIONS.find(s => s.slug === slug).body;

const PARTE1 = `O Canil Yannis do Oeste dedica-se à criação de Rottweilers com base em linhagens do Leste Europeu, especialmente da Sérvia e da Croácia. Nosso plantel reúne exemplares importados e descendentes dessas origens, selecionados para um trabalho de criação que valoriza genealogia, conformação física, temperamento e saúde.

## Genealogia e planejamento
Entre as principais referências genéticas presentes em nossos cães estão Timit-Tor e vom Hause Edelstein. A análise dos pedigrees integra o planejamento dos acasalamentos, permitindo conhecer a contribuição dos ancestrais e avaliar a complementaridade entre os reprodutores. Nosso objetivo é orientar a seleção de forma criteriosa, considerando as características individuais de cada cão e os resultados que buscamos ao longo das gerações.

## Seleção morfológica
Na seleção morfológica, valorizamos estrutura óssea consistente, musculatura bem desenvolvida, proporções corporais harmoniosas e cabeça expressiva, em conjunto com aspectos funcionais, como movimentação, equilíbrio e capacidade física. Buscamos cães que representem as características da raça, com atenção à relação entre aparência, funcionalidade e qualidade de vida.

## Temperamento
O temperamento também ocupa uma posição central em nosso trabalho. Valorizamos cães seguros, atentos e equilibrados, preservando o instinto de guarda característico do Rottweiler. Acompanhamos o comportamento dos exemplares no manejo diário e reconhecemos a importância da socialização, das experiências durante o desenvolvimento e da orientação aos futuros tutores.

## Saúde
A saúde é considerada em conjunto com a genealogia e a avaliação física. Nosso trabalho contempla acompanhamento médico-veterinário, cuidados preventivos e avaliação da saúde ortopédica dos reprodutores, com atenção à displasia coxofemoral e de cotovelos. Esses aspectos contribuem para decisões reprodutivas mais fundamentadas, reconhecendo que a qualidade de um acasalamento depende de múltiplos fatores.

## Rotina do canil
A rotina do canil conta com a atuação da médica-veterinária Bruna, CRMV-SC 15192, responsável técnica e sócia, que participa do acompanhamento sanitário, nutricional e reprodutivo do plantel. A alimentação é ajustada às necessidades de cada fase, considerando crescimento, manutenção, gestação, lactação e recuperação da condição corporal.

## Nosso compromisso
Para o Canil Yannis do Oeste, criar significa acompanhar, avaliar e aperfeiçoar continuamente. Nosso compromisso é desenvolver um trabalho consistente, com respeito às características do Rottweiler, cuidado individual com os animais e transparência sobre sua origem, manejo e desenvolvimento.`;

const P_ROTINA = 'A rotina do canil conta com a atuação da médica-veterinária Bruna, CRMV-SC 15192, responsável técnica e sócia, que participa do acompanhamento sanitário, nutricional e reprodutivo do plantel. A alimentação é ajustada às necessidades de cada fase, considerando crescimento, manutenção, gestação, lactação e recuperação da condição corporal.';
const P_SAUDE = 'A saúde é considerada em conjunto com a genealogia e a avaliação física. Nosso trabalho contempla acompanhamento médico-veterinário, cuidados preventivos e avaliação da saúde ortopédica dos reprodutores, com atenção à displasia coxofemoral e de cotovelos. Esses aspectos contribuem para decisões reprodutivas mais fundamentadas, reconhecendo que a qualidade de um acasalamento depende de múltiplos fatores.';

const GENETICA = `A formação do plantel do Canil Yannis do Oeste tem como referências linhagens europeias, com destaque para Timit-Tor, da Sérvia, e vom Hause Edelstein, da Croácia. Essas origens integram nosso planejamento reprodutivo e representam famílias de cães cuja genealogia permite estudar a contribuição de diferentes ancestrais ao longo das gerações.

Embora frequentemente reunidas sob a expressão “linhagens do Leste Europeu”, essas criações estão particularmente ligadas à região dos Bálcãs e do sudeste europeu. O Rottweiler permanece uma raça de origem alemã, orientada pelo padrão internacional da FCI. As referências sérvias e croatas identificam a procedência dos criatórios e de suas famílias genealógicas, dentro de uma mesma raça.

[[linhagens]]

## Da genealogia à seleção genética
Em uma abordagem técnica, nomes como Timit-Tor e vom Hause Edelstein identificam criatórios e famílias genealógicas. O estudo desses pedigrees ajuda a compreender parentesco, recorrência de ancestrais e possíveis combinações entre reprodutores. A avaliação de um acasalamento deve reunir essas informações à conformação, ao temperamento, à diversidade genética e aos resultados de saúde disponíveis.

A importação amplia o acesso a exemplares e famílias de interesse para nosso projeto. Entretanto, a diversidade genética depende do parentesco real entre os cães: animais provenientes de países ou criatórios diferentes podem compartilhar ancestrais. Por isso, a profundidade e a qualidade das informações genealógicas são importantes para interpretar cada combinação, especialmente quando existem repetições ao longo do pedigree.

## Expressão racial com equilíbrio e funcionalidade
Nosso objetivo de seleção valoriza estrutura óssea consistente, musculatura desenvolvida, cabeça expressiva e proporções harmoniosas. Esses atributos são considerados dentro de um conjunto funcional, com atenção à movimentação e ao equilíbrio corporal. O padrão da FCI descreve um Rottweiler compacto e potente, cuja construção deve permitir força, agilidade e resistência. Também orienta uma cabeça proporcional, com relação equilibrada entre crânio e focinho.

O temperamento participa desse mesmo objetivo. Segurança, estabilidade, atenção ao ambiente e disposição para o trabalho fazem parte da descrição oficial da raça e orientam nossa valorização de cães equilibrados, com presença e comportamento compatíveis com as características do Rottweiler.

No Canil Yannis do Oeste, essas referências internacionais integram um trabalho de seleção que busca associar origem documentada, avaliação individual e planejamento dos acasalamentos. Valorizamos a contribuição das famílias Timit-Tor e vom Hause Edelstein com o propósito de desenvolver gerações que reúnam identidade racial, funcionalidade, saúde e equilíbrio.

Fontes citadas no texto: vom-hause-edelstein.com, ksrs.rs, fci.be, royalkennelclub.com`;

const TIMIT = `O nome Timit-Tor está associado à criação sérvia e ao criador Darko Veselić, com exemplares registrados em entidades cinófilas e presentes em pedigrees internacionais. Um exemplo é Doctor Timit-Tor, documentado pela entidade cinófila sérvia e também em registros genealógicos que permitem acompanhar seus ascendentes.

## Ligação entre famílias europeias
Esses registros mostram também a ligação entre diferentes famílias europeias. Na ascendência de Doctor Timit-Tor, por exemplo, aparecem Lucifer Timit Tor e Hera Timit Tor como pais, além de Lex vom Hause Edelstein entre os avós. Essa conexão demonstra como Timit-Tor e vom Hause Edelstein podem estar reunidos em uma mesma genealogia, resultado de acasalamentos entre exemplares de diferentes criatórios.

## Importância para o nosso projeto de criação
Para nosso projeto de criação, conhecer essas relações permite uma análise mais completa dos reprodutores. Avaliamos quais ancestrais aparecem no pedigree, em quais gerações estão presentes e como suas descendências se relacionam com os exemplares disponíveis para cada acasalamento.

Fontes citadas no texto: ksrs.rs, kennelclub.pk`;

const EDELSTEIN = `O criatório vom Hause Edelstein, da Croácia, documenta uma trajetória com exemplares apresentados em exposições internacionais e especializadas da raça. Seu histórico reúne cães como Lex, Noris, Boa e Eminem vom Hause Edelstein, com registros de genealogia e resultados em eventos cinófilos. Essa documentação oferece referências concretas para estudar famílias e acompanhar sua participação na criação.

## Nossa avaliação
A presença dessa origem em nosso plantel é considerada em conjunto com a avaliação dos próprios cães. A ascendência fornece informações relevantes, enquanto a conformação, a saúde e o comportamento mostram como cada exemplar se desenvolveu e quais características apresenta para o planejamento reprodutivo.

Fontes citadas no texto: vom-hause-edelstein.com`;

const TOPIC_TEXT = {
  sobre: { summary: 'Criação de Rottweilers com base em linhagens do Leste Europeu, selecionados por genealogia, conformação física, temperamento e saúde.', details: PARTE1 },
  genetica: { subtitle: 'As bases do nosso trabalho de seleção', summary: 'Timit-Tor, da Sérvia, e vom Hause Edelstein, da Croácia: as referências que orientam a formação do plantel e o planejamento dos acasalamentos.', details: GENETICA },
  alimentacao: { summary: 'Produtos Royal Canin, escolhidos conforme a idade, a fase de desenvolvimento e as necessidades de cada cão.', details: body('alimentacao') + '\n\n## Acompanhamento e rotina\n' + P_ROTINA },
  vacinacao: { summary: 'Protocolo com a vacina Vanguard Plus V10, da Zoetis, conduzido pela médica-veterinária do canil.' },
  parasitas: { summary: 'Manejo sanitário com NexGard Spectra, conforme indicação veterinária.' },
  'saude-articular': { summary: 'Avaliação de displasia coxofemoral e de cotovelo, com a parceria da Vet-Radis.', details: body('saude-articular') + '\n\n## A saúde no planejamento dos acasalamentos\n' + P_SAUDE },
  pedigree: { summary: 'Pedigree CBKC: a identidade e a genealogia documentadas de cada cão.' },
  microchipagem: { summary: 'Identificação individual dos cães com microchip, em parceria com a Animalltag.' },
  veterinario: { summary: 'Acompanhamento da médica-veterinária e sócia nas diferentes fases da vida dos cães.', details: body('veterinario') + '\n\n## Na rotina do canil\n' + P_ROTINA },
  socios: { summary: 'Darlan e Bruna conduzem uma criação pautada em cuidado diário, seleção criteriosa e compromisso com o bem-estar dos animais.' },
};

const NEW_ROWS = [
  { slug: 'linhagem-timit-tor', sort: 110, title: 'Linhagem Timit-Tor', subtitle: 'Famílias genealógicas da criação sérvia', summary: 'Timit-Tor: famílias genealógicas da criação sérvia, referência na formação do nosso plantel.', details: TIMIT },
  { slug: 'linhagem-vom-hause-edelstein', sort: 111, title: 'Linhagem vom Hause Edelstein', subtitle: 'Uma referência da criação croata', summary: 'vom Hause Edelstein: uma referência da criação croata, presente entre as bases do nosso plantel.', details: EDELSTEIN },
];
module.exports = { TOPIC_TEXT, NEW_ROWS };
