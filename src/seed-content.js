// Conteúdo institucional oficial fornecido pelo canil (semente inicial; editável no painel).
const S = (slug, sort, title, subtitle, body, extra = null) => ({ slug, sort, title, subtitle, body: body.join('\n\n'), extra });
const SECTIONS = [
  S('sobre', 10, 'O Canil Yannis do Oeste', 'Rottweilers com raízes nas linhagens do Leste Europeu', [
    'O Canil Yannis do Oeste dedica-se à criação de Rottweilers com raízes nas linhagens do Leste Europeu, especialmente da Sérvia e da Croácia. Nosso plantel reúne animais importados e descendentes dessas origens, com muitos exemplares que possuem conexão direta com a criação sérvia.',
    'Entre as principais bases genéticas do canil estão Timit-Tor e vom Hause Edelstein, presentes na genealogia dos nossos cães e no planejamento dos acasalamentos.',
    'Nosso trabalho busca unir estrutura forte, cabeça expressiva e temperamento equilibrado ao cuidado com a saúde e o bem-estar. Valorizamos a origem de cada exemplar e acompanhamos seu desenvolvimento com alimentação de qualidade, cuidados veterinários e atenção diária.']),
  S('genetica', 20, 'Genética internacional e seleção criteriosa', null, [
    'A presença de animais importados amplia as possibilidades do nosso trabalho de seleção. Cada acasalamento é planejado considerando a genealogia, as características individuais e a complementaridade entre os exemplares.',
    'As famílias Timit-Tor e vom Hause Edelstein constituem referências para a formação do nosso plantel. Essas origens integram um projeto de criação que valoriza a estrutura, a expressão racial e o temperamento característicos do Rottweiler.',
    'A seleção considera cada cão individualmente, associando sua ascendência à avaliação de suas características e de sua saúde.']),
  S('socios', 30, 'Quem está à frente do canil', null, ['Juntos, conduzem uma criação pautada em cuidado diário, seleção criteriosa e compromisso com o bem-estar dos animais.']),
  S('darlan', 31, 'Darlan', 'Sócio-proprietário', ['Darlan, com formação em Direito e atuação na gestão de empresas, é responsável pela administração, pela organização da estrutura e pelo planejamento do canil.']),
  S('bruna', 32, 'Bruna', 'Sócia-proprietária · Médica-veterinária · CRMV nº 15192', ['Bruna, gestora de qualidade e médica-veterinária, CRMV nº 15192, possui experiência na área pet e em nutrição animal. Participa diretamente do acompanhamento diário do plantel, com atenção à alimentação, à saúde, ao manejo reprodutivo e ao desenvolvimento dos filhotes.']),
  S('alimentacao', 40, 'Alimentação Royal Canin', null, [
    'A alimentação dos nossos cães é realizada com produtos Royal Canin, selecionados conforme a idade, a fase de desenvolvimento e as necessidades individuais de cada animal.',
    'Durante o crescimento, a nutrição adequada contribui para o desenvolvimento dos filhotes. Na fase adulta, o manejo alimentar considera a manutenção da condição corporal e as necessidades de cada exemplar. Gestação, lactação e desmame também recebem atenção específica.',
    'Além do acompanhamento da Bruna, contamos com o suporte de um médico-veterinário da Royal Canin voltado à nutrição, auxiliando nas escolhas alimentares e no manejo nutricional do plantel.']),
  S('vacinacao', 50, 'Vacinação com Zoetis — Vanguard V10', null, [
    'Utilizamos a Vanguard Plus V10, da Zoetis, em nosso protocolo de vacinação. A vacina auxilia na prevenção de importantes doenças caninas, incluindo cinomose, parvovirose, hepatite infecciosa, parainfluenza e leptospirose.',
    'A vacinação é conduzida pela médica-veterinária do canil, com calendário definido conforme a idade, o histórico e as necessidades de cada cão.',
    'O acompanhamento das aplicações e a manutenção dos registros fazem parte da nossa rotina de cuidados com o plantel e os filhotes.'], 'Acompanhamento e registros de vacinação'),
  S('parasitas', 60, 'Controle de parasitas — NexGard Spectra', null, [
    'Nosso manejo sanitário inclui o NexGard Spectra, conforme indicação veterinária, para o controle de pulgas e carrapatos e o tratamento de determinados vermes intestinais.',
    'A escolha do produto e seu uso consideram o peso, a idade e as necessidades de cada animal. A vermifugação e o controle de parasitas são acompanhados pela médica-veterinária e integrados aos demais cuidados preventivos do canil.',
    'Esse trabalho é associado à higiene dos ambientes e à observação diária dos cães.']),
  S('saude-articular', 70, 'Saúde articular', 'Avaliação de displasia e parceria com a Vet-Radis', [
    'No Canil Yannis do Oeste, a saúde articular faz parte do cuidado com o plantel e do planejamento reprodutivo. Todos os animais do nosso plantel possuem laudos de avaliação de displasia coxofemoral e de cotovelo, que auxiliam no acompanhamento individual e na seleção dos acasalamentos.',
    'Para esse trabalho, contamos com a parceria da Vet-Radis, fundada pelo Prof. Dr. Antonio Carlos Cunha Lacreta Junior, médico-veterinário com especialização em radiodiagnóstico e mestrado e doutorado pela Unesp, com ênfase em diagnóstico por imagem.',
    'Sua trajetória inclui atuação como professor de diagnóstico por imagem, produção científica nacional e internacional e três gestões como presidente do Colégio Brasileiro de Radiologia Veterinária.',
    'Essa parceria reforça nosso compromisso com avaliações criteriosas e documentação da saúde articular dos cães. Os resultados orientam nossas decisões de criação, sempre com atenção à mobilidade, ao bem-estar e à qualidade de vida dos animais.']),
  S('pedigree', 80, 'Pedigree CBKC — origem documentada', null, [
    'O pedigree da CBKC — Confederação Brasileira de Cinofilia, entidade brasileira integrante da FCI — Federação Cinológica Internacional, documenta a identidade e a genealogia do cão.',
    'Por meio desse registro, é possível conhecer seus pais e antepassados, preservando o histórico das famílias presentes no plantel e auxiliando no planejamento dos acasalamentos.',
    'No Canil Yannis do Oeste, valorizamos a documentação de origem como parte da transparência e da organização do nosso trabalho de criação.']),
  S('microchipagem', 90, 'Microchipagem — parceria com a Animalltag', null, [
    'Contamos com a Animalltag como parceira na identificação dos nossos cães. O microchip é um pequeno dispositivo implantado sob a pele, que contém um código individual lido por um equipamento específico.',
    'Vinculado ao cadastro do animal e de seu responsável, esse código permite conferir a identidade do cão e pode auxiliar na identificação em caso de perda.',
    'A microchipagem integra nosso compromisso com a identificação individual dos animais, a segurança e a organização dos registros do plantel.']),
  S('veterinario', 100, 'Acompanhamento veterinário na rotina', null, [
    'A presença da Bruna como médica-veterinária e sócia-proprietária permite acompanhar de perto as diferentes fases da vida dos nossos cães.',
    'Sua atuação integra os cuidados nutricionais, sanitários e reprodutivos, além da observação do desenvolvimento dos filhotes e das necessidades de cada exemplar.',
    'Esse acompanhamento orienta as decisões do dia a dia e contribui para uma criação atenta à saúde e ao bem-estar.']),
];
const C = '/assets/content/';
// [slug, arquivo, alt, legenda, publicada]
const IMAGES = [
  ['sobre', 'cuia-canil', 'Cuia personalizada com o emblema do Canil Yannis do Oeste ao lado de um filhote de Rottweiler', null, 1],
  ['sobre', 'filhote-jardim', 'Filhote de Rottweiler sentado no jardim', null, 1],
  ['alimentacao', 'racao-royal-canin', 'Sacos de ração Royal Canin Puppy Maxi', null, 1],
  ['alimentacao', 'filhote-portao', 'Filhote de Rottweiler apoiado em uma porta de madeira', null, 1],
  ['vacinacao', 'vanguard-caixa', 'Embalagem da vacina Vanguard Plus, da Zoetis', null, 1],
  ['vacinacao', 'vanguard-bula', 'Descrição do produto Vanguard Plus', null, 1],
  ['vacinacao', 'racao-e-carteirinhas', 'Carteirinhas de vacinação do Canil Yannis do Oeste', 'Carteirinhas de vacinação do canil', 1],
  ['vacinacao', 'carteirinhas-contato', 'Carteirinhas de vacinação e material impresso do canil', 'Aguardando confirmação: os contatos impressos diferem dos oficiais', 0],
  ['saude-articular', 'vetradis-parceria', 'Material de divulgação da parceria entre a Vet-Radis e o Canil Yannis do Oeste', null, 1],
  ['saude-articular', 'raio-x-1', 'Imagem radiográfica fornecida pelo canil', null, 1],
  ['saude-articular', 'raio-x-2', 'Imagem radiográfica fornecida pelo canil', null, 1],
];
// [arquivo, legenda, categoria, publicada]
const GALLERY = [
  ['filhote-jardim', 'Filhote de Rottweiler', 'FILHOTES', 1],
  ['filhote-portao', 'Filhote de Rottweiler', 'FILHOTES', 1],
  ['cuia-canil', 'Cuia personalizada com o emblema do canil', 'CANIL', 1],
  ['pessoa-com-filhote-1', 'Imagem aguardando classificação', 'PESSOAS', 0],
  ['pessoa-com-filhote-2', 'Imagem aguardando classificação', 'PESSOAS', 0],
];
const VIDEOS = [
  { slot: 'canil', title: 'Conheça o Canil Yannis do Oeste', description: 'Um olhar mais próximo sobre o Canil Yannis do Oeste.', url: null, poster: null, published: 0 },
  { slot: 'filhotes', title: 'Conheça nossos filhotes', description: null, url: '/assets/video/filhotes.mp4', poster: '/assets/video/filhotes-poster.webp', published: 1 },
];
module.exports = { SECTIONS, IMAGES, GALLERY, VIDEOS, C };
