const fs = require('fs');
const path = require('path');

const data = [
  // Příroda a počasí
  ["il sole", "slunce", "Příroda a počasí", "A1", "il sóle"],
  ["la luna", "měsíc", "Příroda a počasí", "A1", "la lúna"],
  ["l'albero", "strom", "Příroda a počasí", "A1", "lálbero"],
  ["il bosco", "les", "Příroda a počasí", "A1", "il bósko"],
  ["il fiume", "řeka", "Příroda a počasí", "A1", "il fjúme"],
  ["la pioggia", "déšť", "Příroda a počasí", "A1", "la pjóža"],
  ["la neve", "sníh", "Příroda a počasí", "A1", "la néve"],
  ["la nuvola", "mrak", "Příroda a počasí", "A1", "la núvola"],
  ["il vento", "vítr", "Příroda a počasí", "A1", "il vénto"],
  ["il fiore", "květina", "Příroda a počasí", "A1", "il fjóre"],
  ["la montagna", "hora", "Příroda a počasí", "A1", "la montáňa"],
  ["la valle", "údolí", "Příroda a počasí", "A1", "la vále"],
  ["il lago", "jezero", "Příroda a počasí", "A1", "il lágo"],
  ["il mare", "moře", "Příroda a počasí", "A1", "il máre"],
  ["l'isola", "ostrov", "Příroda a počasí", "A1", "lízola"],

  // Emoce a vlastnosti
  ["felice", "šťastný", "Emoce a vlastnosti", "A1", "felíče"],
  ["triste", "smutný", "Emoce a vlastnosti", "A1", "tríste"],
  ["arrabbiato", "naštvaný", "Emoce a vlastnosti", "A1", "arabiáto"],
  ["stanco", "unavený", "Emoce a vlastnosti", "A1", "stánko"],
  ["sorpreso", "překvapený", "Emoce a vlastnosti", "A1", "sorprézo"],
  ["noioso", "nudný", "Emoce a vlastnosti", "A1", "nojózo"],
  ["interessante", "zajímavý", "Emoce a vlastnosti", "A1", "interesánte"],
  ["bello", "hezký", "Emoce a vlastnosti", "A1", "bélo"],
  ["brutto", "ošklivý", "Emoce a vlastnosti", "A1", "brúto"],
  ["intelligente", "chytrý", "Emoce a vlastnosti", "A1", "intelidžénte"],
  ["stupido", "hloupý", "Emoce a vlastnosti", "A1", "stúpido"],
  ["veloce", "rychlý", "Emoce a vlastnosti", "A1", "velóče"],
  ["lento", "pomalý", "Emoce a vlastnosti", "A1", "lénto"],
  ["grande", "velký", "Emoce a vlastnosti", "A1", "gránde"],
  ["piccolo", "malý", "Emoce a vlastnosti", "A1", "píkolo"],

  // Město a doprava
  ["la macchina", "auto", "Město a doprava", "A1", "la mákina"],
  ["l'autobus", "autobus", "Město a doprava", "A1", "lautobus"],
  ["il tram", "tramvaj", "Město a doprava", "A1", "il tram"],
  ["la metropolitana", "metro", "Město a doprava", "A1", "la metropolitána"],
  ["la strada", "ulice", "Město a doprava", "A1", "la stráda"],
  ["la piazza", "náměstí", "Město a doprava", "A1", "la pjáca"],
  ["il negozio", "obchod", "Město a doprava", "A1", "il negócjo"],
  ["il ristorante", "restaurace", "Město a doprava", "A1", "il ristoránte"],
  ["la scuola", "škola", "Město a doprava", "A1", "la skuóla"],
  ["l'ospedale", "nemocnice", "Město a doprava", "A1", "lospedále"],
  ["la banca", "banka", "Město a doprava", "A1", "la bánka"],
  ["la posta", "pošta", "Město a doprava", "A1", "la pósta"],
  ["il parco", "park", "Město a doprava", "A1", "il párko"],
  ["il ponte", "most", "Město a doprava", "A1", "il pónte"],
  ["il semaforo", "semafor", "Město a doprava", "A1", "il semáforo"],

  // Dům a domácnost
  ["il tavolo", "stůl", "Dům a domácnost", "A1", "il távolo"],
  ["la sedia", "židle", "Dům a domácnost", "A1", "la sédja"],
  ["il letto", "postel", "Dům a domácnost", "A1", "il léto"],
  ["l'armadio", "skříň", "Dům a domácnost", "A1", "larmádjo"],
  ["la porta", "dveře", "Dům a domácnost", "A1", "la pórta"],
  ["la finestra", "okno", "Dům a domácnost", "A1", "la finéstra"],
  ["la cucina", "kuchyně", "Dům a domácnost", "A1", "la kučína"],
  ["il bagno", "koupelna", "Dům a domácnost", "A1", "il báňo"],
  ["il water", "záchod", "Dům a domácnost", "A1", "il váter"],
  ["la televisione", "televize", "Dům a domácnost", "A1", "la televizjóne"],
  ["il computer", "počítač", "Dům a domácnost", "A1", "il kompjúter"],
  ["il libro", "kniha", "Dům a domácnost", "A1", "il líbro"],
  ["la lampada", "lampa", "Dům a domácnost", "A1", "la lámpada"],
  ["lo specchio", "zrcadlo", "Dům a domácnost", "A1", "lo spékjo"],
  ["la chiave", "klíč", "Dům a domácnost", "A1", "la kjáve"],

  // Práce a povolání
  ["l'insegnante", "učitel", "Práce a povolání", "A1", "linseňánte"],
  ["il medico", "doktor", "Práce a povolání", "A1", "il médiko"],
  ["l'ingegnere", "inženýr", "Práce a povolání", "A1", "lindžeňére"],
  ["l'avvocato", "právník", "Práce a povolání", "A1", "lavokáto"],
  ["il cuoco", "kuchař", "Práce a povolání", "A1", "il kuóko"],
  ["il cameriere", "číšník", "Práce a povolání", "A1", "il kamerjére"],
  ["il poliziotto", "policista", "Práce a povolání", "A1", "il policjóto"],
  ["il pompiere", "hasič", "Práce a povolání", "A1", "il pompjére"],
  ["il commesso", "prodavač", "Práce a povolání", "A1", "il koméso"],
  ["il manager", "manažer", "Práce a povolání", "A1", "il menedžer"],
  ["l'autista", "řidič", "Práce a povolání", "A1", "lautísta"],
  ["l'artista", "umělec", "Práce a povolání", "A1", "lartísta"],
  ["l'attore", "herec", "Práce a povolání", "A1", "latóre"],
  ["il cantante", "zpěvák", "Práce a povolání", "A1", "il kantánte"],
  ["lo studente", "student", "Práce a povolání", "A1", "lo studénte"],

  // Tělo a zdraví
  ["la testa", "hlava", "Tělo a zdraví", "A1", "la tésta"],
  ["il braccio", "paže", "Tělo a zdraví", "A1", "il bráčo"],
  ["la mano", "ruka", "Tělo a zdraví", "A1", "la máno"],
  ["la gamba", "noha", "Tělo a zdraví", "A1", "la gámba"],
  ["il piede", "chodidlo", "Tělo a zdraví", "A1", "il pjéde"],
  ["l'occhio", "oko", "Tělo a zdraví", "A1", "lókjo"],
  ["l'orecchio", "ucho", "Tělo a zdraví", "A1", "lorékjo"],
  ["il naso", "nos", "Tělo a zdraví", "A1", "il názo"],
  ["la bocca", "ústa", "Tělo a zdraví", "A1", "la bóka"],
  ["il dente", "zub", "Tělo a zdraví", "A1", "il dénte"],
  ["i capelli", "vlasy", "Tělo a zdraví", "A1", "i kapéli"],
  ["il cuore", "srdce", "Tělo a zdraví", "A1", "il kuóre"],
  ["il sangue", "krev", "Tělo a zdraví", "A1", "il sángue"],
  ["il dolore", "bolest", "Tělo a zdraví", "A1", "il dolóre"],
  ["la medicina", "lék", "Tělo a zdraví", "A1", "la medičína"],
  
  // Škola a vzdělávání
  ["l'esame", "zkouška", "Škola a vzdělávání", "A1", "lezáme"],
  ["i compiti", "úkoly", "Škola a vzdělávání", "A1", "i kómpiti"],
  ["la lezione", "lekce", "Škola a vzdělávání", "A1", "la lecióne"],
  ["il quaderno", "sešit", "Škola a vzdělávání", "A1", "il kuadérno"],
  ["la penna", "pero", "Škola a vzdělávání", "A1", "la péna"],
  ["la matita", "tužka", "Škola a vzdělávání", "A1", "la matíta"],
  ["la lavagna", "tabule", "Škola a vzdělávání", "A1", "la laváňa"],
  ["lo zaino", "batoh", "Škola a vzdělávání", "A1", "lo zájno"],
  ["l'università", "univerzita", "Škola a vzdělávání", "A1", "luniversitá"],
  ["la classe", "třída", "Škola a vzdělávání", "A1", "la kláse"]
];

const words = data.map(w => ({
  italian: w[0],
  czech: w[1],
  category: w[2],
  difficulty: w[3],
  pronunciation: w[4],
  example_it: `Ecco ${w[0]}.`,
  example_cz: `Tady je ${w[1]}.`
}));

fs.writeFileSync(path.join(__dirname, 'extra_words.json'), JSON.stringify(words, null, 2));
console.log('Extra words generated!');
