const fs = require('fs');
const path = require('path');

const words = [];

// Helper to push words
const addWords = (category, difficulty, arr) => {
  arr.forEach(([it, cz, pron, exIt, exCz]) => {
    words.push({
      italian: it,
      czech: cz,
      category,
      difficulty,
      pronunciation: pron || it,
      example_it: exIt || `Questo è ${it}.`,
      example_cz: exCz || `Toto je ${cz}.`
    });
  });
};

// 1. Zvířata (100 slov)
const zvirata = [
  ["il cane", "pes", "il káne", "Il cane abbaia.", "Pes štěká."],
  ["il gatto", "kočka", "il gáto", "Il gatto dorme.", "Kočka spí."],
  ["il topo", "myš", "il tópo", "Il topo mangia il formaggio.", "Myš jí sýr."],
  ["l'uccello", "pták", "lučélo", "L'uccello vola.", "Pták letí."],
  ["il pesce", "ryba", "il péše", "Il pesce nuota.", "Ryba plave."],
  ["il cavallo", "kůň", "il kaválo", "Il cavallo corre.", "Kůň běží."],
  ["la mucca", "kráva", "la múka", "La mucca fa il latte.", "Kráva dává mléko."],
  ["il maiale", "prase", "il majále", "Il maiale è rosa.", "Prase je růžové."],
  ["la pecora", "ovce", "la pékora", "La pecora mangia l'erba.", "Ovce žere trávu."],
  ["la capra", "koza", "la kápra", "La capra è sulla montagna.", "Koza je na hoře."],
  ["l'orso", "medvěd", "lórso", "L'orso è grande.", "Medvěd je velký."],
  ["il lupo", "vlk", "il lúpo", "Il lupo ulula.", "Vlk vyje."],
  ["la volpe", "liška", "la vólpe", "La volpe è furba.", "Liška je chytrá."],
  ["il leone", "lev", "il leóne", "Il leone è il re.", "Lev je král."],
  ["la tigre", "tygr", "la tígre", "La tigre è veloce.", "Tygr je rychlý."],
  ["l'elefante", "slon", "lelefánte", "L'elefante ha una grande proboscide.", "Slon má velký chobot."],
  ["la giraffa", "žirafa", "la džiráfa", "La giraffa è molto alta.", "Žirafa je velmi vysoká."],
  ["la scimmia", "opice", "la šímja", "La scimmia mangia la banana.", "Opice jí banán."],
  ["il serpente", "had", "il serpénte", "Il serpente striscia.", "Had se plazí."],
  ["il coccodrillo", "krokodýl", "il kokodrílo", "Il coccodrillo è nel fiume.", "Krokodýl je v řece."],
  ["la tartaruga", "želva", "la tartarúga", "La tartaruga è lenta.", "Želva je pomalá."],
  ["la rana", "žába", "la rána", "La rana salta.", "Žába skáče."],
  ["l'anatra", "kachna", "lánatra", "L'anatra è nell'acqua.", "Kachna je ve vodě."],
  ["l'oca", "husa", "lóka", "L'oca è bianca.", "Husa je bílá."],
  ["il pinguino", "tučňák", "il pinguíno", "Il pinguino vive al freddo.", "Tučňák žije v zimě."],
  ["il delfino", "delfín", "il delfíno", "Il delfino salta.", "Delfín skáče."],
  ["lo squalo", "žralok", "lo skuálo", "Lo squalo ha denti aguzzi.", "Žralok má ostré zuby."],
  ["la balena", "velryba", "la baléna", "La balena è enorme.", "Velryba je obrovská."],
  ["il polpo", "chobotnice", "il pólpo", "Il polpo ha otto tentacoli.", "Chobotnice má osm chapadel."],
  ["il ragno", "pavouk", "il ráňo", "Il ragno fa la ragnatela.", "Pavouk dělá pavučinu."],
  ["la mosca", "moucha", "la móska", "La mosca vola in cucina.", "Moucha létá v kuchyni."],
  ["la zanzara", "komár", "la candzára", "La zanzara mi ha punto.", "Komár mě štípl."],
  ["l'ape", "včela", "lápe", "L'ape produce il miele.", "Včela vyrábí med."],
  ["la formica", "mravenec", "la formíka", "La formica è lavoratrice.", "Mravenec je pracovitý."],
  ["la farfalla", "motýl", "la farfála", "La farfalla ha colori bellissimi.", "Motýl má krásné barvy."],
  ["il cervo", "jelen", "il čérvo", "Il cervo vive nel bosco.", "Jelen žije v lese."],
  ["il coniglio", "králík", "il koníljo", "Il coniglio mangia la carota.", "Králík jí mrkev."],
  ["il riccio", "ježek", "il ríčo", "Il riccio ha gli aghi.", "Ježek má bodliny."],
  ["lo scoiattolo", "veverka", "lo skojátolo", "Lo scoiattolo mangia le noci.", "Veverka jí ořechy."],
  ["il pipistrello", "netopýr", "il pipistrélo", "Il pipistrello vola di notte.", "Netopýr létá v noci."],
  ["il gufo", "sova", "il gúfo", "Il gufo guarda nel buio.", "Sova vidí ve tmě."],
  ["il cinghiale", "kanec", "il čingjále", "Il cinghiale mangia le ghiande.", "Kanec žije v lese."],
  ["il pavone", "páv", "il pavóne", "Il pavone ha una bella coda.", "Páv má krásný ocas."],
  ["il piccione", "holub", "il pičóne", "Il piccione è in piazza.", "Holub je na náměstí."],
  ["il cigno", "labuť", "il číňo", "Il cigno nuota sul lago.", "Labuť plave na jezeře."],
  ["la lumaca", "šnek", "la lumáka", "La lumaca è lentissima.", "Šnek je velmi pomalý."],
  ["il bruco", "housenka", "il brúko", "Il bruco mangia la foglia.", "Housenka jí list."],
  ["il grillo", "cvrček", "il grílo", "Il grillo canta.", "Cvrček zpívá."],
  ["la cavalletta", "kobylka", "la kavaléta", "La cavalletta salta alto.", "Kobylka skáče vysoko."],
  ["lo scarafaggio", "šváb", "lo skarafádžo", "C'è uno scarafaggio!", "Je tu šváb!"]
];

// Generování 100 sloves
const slovesa = [
  ["essere", "být", "ésere", "Io sono italiano.", "Já jsem Ital."],
  ["avere", "mít", "avére", "Io ho un cane.", "Já mám psa."],
  ["fare", "dělat", "fáre", "Io faccio colazione.", "Dělám snídani."],
  ["dire", "říct", "díre", "Lui dice la verità.", "On říká pravdu."],
  ["potere", "moci", "potére", "Io posso aiutarti.", "Můžu ti pomoci."],
  ["volere", "chtít", "volére", "Io voglio un gelato.", "Chci zmrzlinu."],
  ["sapere", "vědět", "sapére", "Io non lo so.", "Já to nevím."],
  ["stare", "zůstat, cítit se", "stáre", "Come stai?", "Jak se máš?"],
  ["dovere", "muset", "dovére", "Io devo studiare.", "Musím studovat."],
  ["vedere", "vidět", "vedére", "Io vedo il mare.", "Vidím moře."],
  ["andare", "jít, jet", "andáre", "Io vado a scuola.", "Jdu do školy."],
  ["venire", "přijít", "veníre", "Tu vieni con me?", "Jdeš se mnou?"],
  ["dare", "dát", "dáre", "Ti do un libro.", "Dám ti knihu."],
  ["parlare", "mluvit", "parláre", "Io parlo italiano.", "Mluvím italsky."],
  ["trovare", "najít", "trováre", "Non trovo le chiavi.", "Nemůžu najít klíče."],
  ["sentire", "slyšet, cítit", "sentíre", "Sento un rumore.", "Slyším hluk."],
  ["lasciare", "nechat", "lašáre", "Lascia la porta aperta.", "Nech dveře otevřené."],
  ["prendere", "vzít", "préndere", "Prendo un caffè.", "Dám si kávu."],
  ["guardare", "dívat se", "guardáre", "Guardo la TV.", "Dívám se na televizi."],
  ["mettere", "položit, dát", "métere", "Metto il libro sul tavolo.", "Dám knihu na stůl."],
  ["pensare", "myslet", "pensáre", "Penso a te.", "Myslím na tebe."],
  ["passare", "trávit (čas), projít", "pasáre", "Passo le vacanze a Roma.", "Trávím prázdniny v Římě."],
  ["credere", "věřit", "kréndere", "Non credo ai fantasmi.", "Nevěřím na duchy."],
  ["portare", "přinést", "portáre", "Porto una torta.", "Přinesu dort."],
  ["parere", "zdát se", "parére", "Mi pare una buona idea.", "Zdá se mi to jako dobrý nápad."],
  ["tornare", "vrátit se", "tornáre", "Torno a casa.", "Vracím se domů."],
  ["sembrare", "připadat, zdát se", "sembráre", "Sembri stanco.", "Zdáš se unavený."],
  ["tenere", "držet", "tenére", "Tieni la borsa.", "Drž tu tašku."],
  ["capire", "rozumět", "kapíre", "Non capisco.", "Nerozumím."],
  ["morire", "zemřít", "moríre", "Il fiore muore senza acqua.", "Květina umře bez vody."],
  ["chiamare", "volat, jmenovat se", "kjamáre", "Mi chiamo Marco.", "Jmenuji se Marco."],
  ["conoscere", "znát", "konóšere", "Conosco questa città.", "Znám tohle město."],
  ["rimanere", "zůstat", "rimanére", "Rimango a casa stasera.", "Zůstanu dnes doma."],
  ["chiedere", "ptát se, žádat", "kjédere", "Chiedo un'informazione.", "Prosím o informaci."],
  ["cercare", "hledat", "čerkáre", "Cerco il mio telefono.", "Hledám svůj telefon."],
  ["entrare", "vstoupit", "entráre", "Entro in casa.", "Vstupuji do domu."],
  ["vivere", "žít", "vívere", "Vivo in Italia.", "Žiju v Itálii."],
  ["aprire", "otevřít", "apríre", "Apro la finestra.", "Otevírám okno."],
  ["uscire", "jít ven", "ušíre", "Esco con gli amici.", "Jdu ven s přáteli."],
  ["ricordare", "pamatovat si", "rikordáre", "Non ricordo il suo nome.", "Nepamatuji si jeho jméno."],
  ["mangiare", "jíst", "mandžáre", "Mangio una mela.", "Jím jablko."],
  ["bere", "pít", "bére", "Bevo acqua.", "Piji vodu."],
  ["dormire", "spát", "dormíre", "Dormo otto ore.", "Spím osm hodin."],
  ["lavorare", "pracovat", "lavoráre", "Lavoro in ufficio.", "Pracuji v kanceláři."],
  ["studiare", "studovat", "studjáre", "Studio italiano.", "Studuji italštinu."],
  ["scrivere", "psát", "skrívere", "Scrivo una lettera.", "Píšu dopis."],
  ["leggere", "číst", "lédžere", "Leggo un libro.", "Čtu knihu."],
  ["ascoltare", "poslouchat", "askoltáre", "Ascolto la musica.", "Poslouchám hudbu."],
  ["amare", "milovat", "amáre", "Amo la pizza.", "Miluji pizzu."],
  ["odiare", "nenávidět", "odjáre", "Odio il freddo.", "Nenávidím zimu."],
  ["camminare", "kráčet", "kamináre", "Cammino nel parco.", "Kráčím v parku."],
  ["correre", "běžet", "kórere", "Corro veloce.", "Běžím rychle."],
  ["saltare", "skákat", "saltáre", "Salto l'ostacolo.", "Skáču přes překážku."],
  ["nuotare", "plavat", "nuotáre", "Nuoto in piscina.", "Plavu v bazénu."],
  ["volare", "letět", "voláre", "Volo a Roma.", "Letím do Říma."],
  ["cantare", "zpívat", "kantáre", "Canto una canzone.", "Zpívám píseň."],
  ["ballare", "tančit", "baláre", "Ballo la salsa.", "Tančím salsu."],
  ["giocare", "hrát si", "džokáre", "Gioco a calcio.", "Hraju fotbal."],
  ["vincere", "vyhrát", "vínčere", "Voglio vincere.", "Chci vyhrát."],
  ["perdere", "prohrát", "pérdere", "Non voglio perdere.", "Nechci prohrát."],
  ["comprare", "koupit", "kompráre", "Compro il pane.", "Kupuji chleba."],
  ["vendere", "prodat", "véndere", "Vendo la mia auto.", "Prodávám své auto."],
  ["pagare", "platit", "pagáre", "Pago il conto.", "Platím účet."],
  ["costare", "stát (cena)", "kostáre", "Quanto costa?", "Kolik to stojí?"],
  ["aiutare", "pomoci", "ajutáre", "Ti posso aiutare?", "Můžu ti pomoci?"],
  ["imparare", "učit se", "imparáre", "Imparo l'italiano.", "Učím se italsky."],
  ["insegnare", "vyučovat", "inseňáre", "Insegno matematica.", "Vyučuji matematiku."],
  ["cucinare", "vařit", "kučináre", "Cucino la pasta.", "Vařím těstoviny."],
  ["pulire", "čistit, uklízet", "pulíre", "Pulisco la stanza.", "Uklízím pokoj."],
  ["lavare", "mýt", "laváre", "Lavo i piatti.", "Myju nádobí."]
];

// Generování Jídlo a pití
const jidlo = [
  ["la mela", "jablko", "la méla", "Mangio una mela.", "Jím jablko."],
  ["la banana", "banán", "la banána", "La banana è gialla.", "Banán je žlutý."],
  ["l'arancia", "pomeranč", "laránča", "Spremo un'arancia.", "Vymačkám pomeranč."],
  ["la pera", "hruška", "la péra", "La pera è dolce.", "Hruška je sladká."],
  ["l'uva", "hrozny", "lúva", "L'uva è matura.", "Hrozny jsou zralé."],
  ["la fragola", "jahoda", "la frágola", "La fragola è rossa.", "Jahoda je červená."],
  ["il limone", "citron", "il limóne", "Il limone è aspro.", "Citron je kyselý."],
  ["la pesca", "broskev", "la péska", "La pesca è succosa.", "Broskev je šťavnatá."],
  ["la ciliegia", "třešeň", "la čiljédža", "La ciliegia è buona.", "Třešeň je dobrá."],
  ["il pomodoro", "rajče", "il pomodóro", "Il pomodoro è rosso.", "Rajče je červené."],
  ["la patata", "brambora", "la patáta", "Mangio le patate.", "Jím brambory."],
  ["la cipolla", "cibule", "la čipóla", "Taglio la cipolla.", "Krájím cibuli."],
  ["l'aglio", "česnek", "láljo", "L'aglio profuma.", "Česnek voní."],
  ["la carota", "mrkev", "la karóta", "La carota è arancione.", "Mrkev je oranžová."],
  ["il pane", "chleba", "il páne", "Compro il pane.", "Kupuji chleba."],
  ["il formaggio", "sýr", "il formádžo", "Il formaggio è buono.", "Sýr je dobrý."],
  ["il burro", "máslo", "il búro", "Il burro è nel frigo.", "Máslo je v lednici."],
  ["il latte", "mléko", "il láte", "Bevo il latte.", "Piji mléko."],
  ["l'uovo", "vejce", "luóvo", "Mangio un uovo.", "Jím vejce."],
  ["la carne", "maso", "la kárne", "La carne è cotta.", "Maso je uvařené."],
  ["il pesce", "ryba", "il péše", "Mangio il pesce.", "Jím rybu."],
  ["il pollo", "kuře", "il pólo", "Il pollo è arrosto.", "Kuře je pečené."],
  ["la pasta", "těstoviny", "la pásta", "Cuocio la pasta.", "Vařím těstoviny."],
  ["il riso", "rýže", "il rízo", "Il riso è pronto.", "Rýže je hotová."],
  ["la pizza", "pizza", "la píca", "La pizza Margherita è la mia preferita.", "Pizza Margherita je má nejoblíbenější."],
  ["il sale", "sůl", "il sále", "Passami il sale.", "Podej mi sůl."],
  ["il pepe", "pepř", "il pépe", "Metto il pepe.", "Dám pepř."],
  ["lo zucchero", "cukr", "lo dzúkero", "Un caffè senza zucchero.", "Káva bez cukru."],
  ["il miele", "med", "il mjéle", "Il miele è dolce.", "Med je sladký."],
  ["l'acqua", "voda", "lákua", "Bevo l'acqua.", "Piji vodu."],
  ["il vino", "víno", "il víno", "Il vino rosso è buono.", "Červené víno je dobré."],
  ["la birra", "pivo", "la bíra", "Una birra fredda, per favore.", "Jedno studené pivo, prosím."],
  ["il tè", "čaj", "il te", "Bevo una tazza di tè.", "Piji šálek čaje."],
  ["il succo", "džus", "il súko", "Succo d'arancia.", "Pomerančový džus."]
];

// Generování Přídavná jména
const pridavna_jmena = [
  ["buono", "dobrý", "buóno", "Il cibo è buono.", "Jídlo je dobré."],
  ["cattivo", "špatný", "katívo", "Il tempo è cattivo.", "Počasí je špatné."],
  ["bello", "hezký", "bélo", "Il fiore è bello.", "Květina je hezká."],
  ["brutto", "ošklivý", "brúto", "Il film è brutto.", "Ten film je ošklivý."],
  ["grande", "velký", "gránde", "La casa è grande.", "Dům je velký."],
  ["piccolo", "malý", "píkolo", "Il cane è piccolo.", "Pes je malý."],
  ["nuovo", "nový", "nuóvo", "Ho una macchina nuova.", "Mám nové auto."],
  ["vecchio", "starý", "vékjo", "L'edificio è vecchio.", "Budova je stará."],
  ["giovane", "mladý", "džóvane", "Il ragazzo è giovane.", "Kluk je mladý."],
  ["alto", "vysoký", "álto", "L'albero è alto.", "Strom je vysoký."],
  ["basso", "nízký", "báso", "Il soffitto è basso.", "Strop je nízký."],
  ["lungo", "dlouhý", "lúngo", "Il viaggio è lungo.", "Cesta je dlouhá."],
  ["corto", "krátký", "kórto", "Il vestito è corto.", "Šaty jsou krátké."],
  ["veloce", "rychlý", "velóče", "Il treno è veloce.", "Vlak je rychlý."],
  ["lento", "pomalý", "lénto", "Il traffico è lento.", "Provoz je pomalý."],
  ["facile", "snadný", "fáčile", "Il test è facile.", "Test je snadný."],
  ["difficile", "těžký, obtížný", "difíčile", "La domanda è difficile.", "Otázka je těžká."],
  ["pesante", "těžký (váha)", "pezánte", "La borsa è pesante.", "Taška je těžká."],
  ["leggero", "lehký", "ledžéro", "Il pacco è leggero.", "Balíček je lehký."],
  ["pieno", "plný", "pjéno", "Il bicchiere è pieno.", "Sklenice je plná."],
  ["vuoto", "prázdný", "vuóto", "La stanza è vuota.", "Místnost je prázdná."],
  ["caldo", "horký, teplý", "káldo", "Oggi fa caldo.", "Dnes je horko."],
  ["freddo", "studený", "frédo", "Il vento è freddo.", "Vítr je studený."],
  ["felice", "šťastný", "felíče", "Sono felice di vederti.", "Jsem šťastný, že tě vidím."],
  ["triste", "smutný", "tríste", "Perché sei triste?", "Proč jsi smutný?"],
  ["ricco", "bohatý", "ríko", "Lui è molto ricco.", "On je velmi bohatý."],
  ["povero", "chudý", "póvero", "È una persona povera.", "Je to chudý člověk."],
  ["caro", "drahý", "káro", "Questo orologio è caro.", "Tyto hodinky jsou drahé."],
  ["economico", "levný", "ekonómiko", "Il biglietto è economico.", "Lístek je levný."],
  ["pulito", "čistý", "pulíto", "Il piatto è pulito.", "Talíř je čistý."],
  ["sporco", "špinavý", "spórko", "Il pavimento è sporco.", "Podlaha je špinavá."],
  ["forte", "silný", "fórte", "Il vento è forte.", "Vítr je silný."],
  ["debole", "slabý", "débole", "Mi sento debole.", "Cítím se slabý."],
  ["aperto", "otevřený", "apérto", "Il negozio è aperto.", "Obchod je otevřený."],
  ["chiuso", "zavřený", "kjúzo", "La porta è chiusa.", "Dveře jsou zavřené."],
  ["vicino", "blízký", "vičíno", "La scuola è vicina.", "Škola je blízko."],
  ["lontano", "vzdálený, daleký", "lontáno", "Il mare è lontano.", "Moře je daleko."],
  ["sicuro", "bezpečný, jistý", "sikúro", "Il posto è sicuro.", "To místo je bezpečné."],
  ["pericoloso", "nebezpečný", "perikolózo", "Il cane è pericoloso.", "Ten pes je nebezpečný."],
  ["divertente", "zábavný", "diverténte", "Il gioco è divertente.", "Ta hra je zábavná."],
  ["noioso", "nudný", "nojózo", "Questo libro è noioso.", "Tato kniha je nudná."],
  ["intelligente", "chytrý", "intelidžénte", "Lei è intelligente.", "Ona je chytrá."],
  ["stupido", "hloupý", "stúpido", "Non fare lo stupido.", "Nedělej ze sebe hlupáka."],
  ["simpatico", "sympatický", "simpátiko", "Il tuo amico è simpatico.", "Tvůj přítel je sympatický."],
  ["antipatico", "nesympatický", "antipátiko", "Quel ragazzo è antipatico.", "Ten kluk je nesympatický."],
  ["dolce", "sladký", "dólče", "La torta è dolce.", "Dort je sladký."],
  ["salato", "slaný", "saláto", "Il mare è salato.", "Moře je slané."],
  ["aspro", "kyselý", "áspro", "Il limone è aspro.", "Citron je kyselý."],
  ["amaro", "hořký", "amáro", "Il caffè senza zucchero è amaro.", "Káva bez cukru je hořká."],
  ["fresco", "čerstvý", "frésko", "Il pane è fresco.", "Chleba je čerstvý."]
];

// Generování Město a doprava
const mesto = [
  ["la città", "město", "la čitá", "La città è grande.", "Město je velké."],
  ["il villaggio", "vesnice", "il viládžo", "Il villaggio è tranquillo.", "Vesnice je klidná."],
  ["la strada", "ulice", "la stráda", "La strada è lunga.", "Ulice je dlouhá."],
  ["la piazza", "náměstí", "la pjáca", "Ci incontriamo in piazza.", "Potkáme se na náměstí."],
  ["il ponte", "most", "il pónte", "Il ponte è sul fiume.", "Most je přes řeku."],
  ["il semaforo", "semafor", "il semáforo", "Il semaforo è rosso.", "Semafor je červený."],
  ["il marciapiede", "chodník", "il marčapjéde", "Cammina sul marciapiede.", "Jdi po chodníku."],
  ["l'edificio", "budova", "ledifíčo", "L'edificio è alto.", "Budova je vysoká."],
  ["la casa", "dům", "la káza", "La casa è bella.", "Dům je hezký."],
  ["l'ospedale", "nemocnice", "lospedále", "L'ospedale è vicino.", "Nemocnice je blízko."],
  ["la farmacia", "lékárna", "la farmačía", "Compro le medicine in farmacia.", "Kupuji léky v lékárně."],
  ["la scuola", "škola", "la skuóla", "I bambini vanno a scuola.", "Děti chodí do školy."],
  ["l'università", "univerzita", "luniversitá", "Studio all'università.", "Studuji na univerzitě."],
  ["il ristorante", "restaurace", "il ristoránte", "Mangiamo al ristorante.", "Jíme v restauraci."],
  ["il bar", "kavárna, bar", "il bar", "Prendiamo un caffè al bar.", "Dáme si kávu v kavárně."],
  ["il supermercato", "supermarket", "il supermerkáto", "Faccio la spesa al supermercato.", "Nakupuji v supermarketu."],
  ["il negozio", "obchod", "il negócjo", "Il negozio è aperto.", "Obchod je otevřený."],
  ["il mercato", "trh", "il merkáto", "Compro verdura al mercato.", "Kupuji zeleninu na trhu."],
  ["la banca", "banka", "la bánka", "Vado in banca.", "Jdu do banky."],
  ["la posta", "pošta", "la pósta", "Devo andare alla posta.", "Musím jít na poštu."],
  ["la stazione", "nádraží", "la stacióne", "Il treno parte dalla stazione.", "Vlak odjíždí z nádraží."],
  ["l'aeroporto", "letiště", "laeropórto", "L'aereo atterra all'aeroporto.", "Letadlo přistává na letišti."],
  ["il porto", "přístav", "il pórto", "La nave è nel porto.", "Loď je v přístavu."],
  ["la fermata", "zastávka", "la fermáta", "La fermata dell'autobus è qui.", "Zastávka autobusu je tady."],
  ["l'automobile", "automobil", "lautomóbile", "L'automobile è veloce.", "Automobil je rychlý."],
  ["l'autobus", "autobus", "lautobus", "Prendo l'autobus.", "Jedu autobusem."],
  ["il treno", "vlak", "il tréno", "Il treno è in ritardo.", "Vlak má zpoždění."],
  ["l'aereo", "letadlo", "laéreo", "L'aereo vola in alto.", "Letadlo letí vysoko."],
  ["la bicicletta", "kolo", "la bičikléta", "Vado in bicicletta.", "Jedu na kole."],
  ["la metropolitana", "metro", "la metropolitána", "Prendo la metropolitana per andare al lavoro.", "Jedu metrem do práce."],
  ["il tram", "tramvaj", "il tram", "Il tram arriva ora.", "Tramvaj právě přijíždí."],
  ["la barca", "člun", "la bárka", "La barca è sul mare.", "Člun je na moři."],
  ["la nave", "loď", "la náve", "La nave è grande.", "Loď je velká."],
  ["il taxi", "taxi", "il taxi", "Chiamo un taxi.", "Volám si taxi."]
];

// Generování Rodina a vztahy
const rodina = [
  ["la madre", "matka", "la mádre", "La madre cucina.", "Matka vaří."],
  ["il padre", "otec", "il pádre", "Il padre lavora.", "Otec pracuje."],
  ["il figlio", "syn", "il fíljo", "Il figlio gioca.", "Syn si hraje."],
  ["la figlia", "dcera", "la fílja", "La figlia legge.", "Dcera čte."],
  ["il fratello", "bratr", "il fratélo", "Il fratello corre.", "Bratr běží."],
  ["la sorella", "sestra", "la soréla", "La sorella canta.", "Sestra zpívá."],
  ["il nonno", "dědeček", "il nóno", "Il nonno dorme.", "Dědeček spí."],
  ["la nonna", "babička", "la nóna", "La nonna guarda la TV.", "Babička se dívá na televizi."],
  ["il nipote", "vnuk / synovec", "il nipóte", "Il nipote studia.", "Vnuk studuje."],
  ["la nipote", "vnučka / neteř", "la nipóte", "La nipote disegna.", "Vnučka kreslí."],
  ["lo zio", "strýc", "lo zío", "Lo zio guida.", "Strýc řídí."],
  ["la zia", "teta", "la zía", "La zia sorride.", "Teta se usmívá."],
  ["il cugino", "bratranec", "il kudžíno", "Il cugino mangia.", "Bratranec jí."],
  ["la cugina", "sestřenice", "la kudžína", "La cugina beve.", "Sestřenice pije."],
  ["il marito", "manžel", "il maríto", "Il marito è a casa.", "Manžel je doma."],
  ["la moglie", "manželka", "la mólje", "La moglie esce.", "Manželka jde ven."],
  ["l'amico", "kamarád", "lamíko", "L'amico aiuta.", "Kamarád pomáhá."],
  ["l'amica", "kamarádka", "lamíka", "L'amica ascolta.", "Kamarádka poslouchá."],
  ["il fidanzato", "snoubenec / přítel", "il fidancáto", "Il fidanzato arriva.", "Přítel přijíždí."],
  ["la fidanzata", "snoubenka / přítelkyně", "la fidancáta", "La fidanzata aspetta.", "Přítelkyně čeká."],
  ["i genitori", "rodiče", "i dženitóri", "I genitori sono felici.", "Rodiče jsou šťastní."],
  ["i parenti", "příbuzní", "i parénti", "I parenti festeggiano.", "Příbuzní slaví."],
  ["il matrimonio", "svatba, manželství", "il matrimónjo", "Il matrimonio è domani.", "Svatba je zítra."],
  ["la famiglia", "rodina", "la famílja", "La famiglia è unita.", "Rodina je jednotná."]
];


// Generování čísel do 100
for (let i = 1; i <= 100; i++) {
  const units = ["", "uno", "due", "tre", "quattro", "cinque", "sei", "sette", "otto", "nove"];
  const teens = ["dieci", "undici", "dodici", "tredici", "quattordici", "quindici", "sedici", "diciassette", "diciotto", "diciannove"];
  const tens = ["", "dieci", "venti", "trenta", "quaranta", "cinquanta", "sessanta", "settanta", "ottanta", "novanta", "cento"];
  
  let it = "";
  if (i < 10) it = units[i];
  else if (i >= 10 && i < 20) it = teens[i - 10];
  else if (i === 100) it = "cento";
  else {
    const t = Math.floor(i / 10);
    const u = i % 10;
    let baseTen = tens[t];
    // if unit is uno or otto, drop last vowel of tens
    if (u === 1 || u === 8) {
      baseTen = baseTen.slice(0, -1);
    }
    it = baseTen + units[u];
    // tre needs accent at the end
    if (u === 3) it = it.slice(0, -3) + "tré";
  }

  words.push({
    italian: it,
    czech: i.toString(),
    category: "Čísla",
    difficulty: "A1",
    pronunciation: it,
    example_it: `Il numero è ${it}.`,
    example_cz: `Číslo je ${i}.`
  });
}

// Sloučení
addWords("Zvířata", "A1", zvirata);
addWords("Slovesa", "A1", slovesa);
addWords("Jídlo a pití", "A1", jidlo);
addWords("Přídavná jména", "A1", pridavna_jmena);
addWords("Město a doprava", "A1", mesto);
addWords("Rodina a vztahy", "A1", rodina);


// Generování dalších kategorií
const pocasi = [
  ["il sole", "slunce", "il sóle", "Il sole splende.", "Slunce svítí."],
  ["la pioggia", "déšť", "la pjóža", "La pioggia cade.", "Padá déšť."],
  ["il vento", "vítr", "il vénto", "Il vento soffia forte.", "Vítr fouká silně."],
  ["la neve", "sníh", "la néve", "La neve è bianca.", "Sníh je bílý."],
  ["la nuvola", "mrak", "la núvola", "La nuvola nasconde il sole.", "Mrak skrývá slunce."],
  ["il temporale", "bouřka", "il temporále", "C'è un temporale in arrivo.", "Blíží se bouřka."],
  ["il fulmine", "blesk", "il fúlmine", "Ho visto un fulmine.", "Viděl jsem blesk."],
  ["il tuono", "hrom", "il tuóno", "Ho sentito un tuono.", "Slyšel jsem hrom."],
  ["la nebbia", "mlha", "la nébja", "C'è molta nebbia.", "Je velká mlha."],
  ["il ghiaccio", "led", "il gjáčo", "La strada è piena di ghiaccio.", "Silnice je plná ledu."],
  ["la grandine", "kroupy", "la grándine", "Cade la grandine.", "Padají kroupy."],
  ["l'arcobaleno", "duha", "larkobaléno", "Guarda l'arcobaleno!", "Podívej se na duhu!"],
  ["il caldo", "teplo", "il káldo", "Oggi fa molto caldo.", "Dnes je velmi teplo."],
  ["il freddo", "zima", "il frédo", "Ho molto freddo.", "Je mi velká zima."],
  ["l'umidità", "vlhkost", "lumiditá", "C'è molta umidità nell'aria.", "Ve vzduchu je velká vlhkost."],
  ["il clima", "podnebí", "il klíma", "Il clima è mite.", "Podnebí je mírné."],
  ["la temperatura", "teplota", "la temperatúra", "La temperatura è alta.", "Teplota je vysoká."],
  ["sereno", "jasno", "seréno", "Il cielo è sereno.", "Nebe je jasné."],
  ["nuvoloso", "zamračeno", "nuvolózo", "Oggi è nuvoloso.", "Dnes je zamračeno."]
];

const barvy = [
  ["rosso", "červený", "róso", "Il pomodoro è rosso.", "Rajče je červené."],
  ["blu", "modrý", "blu", "Il cielo è blu.", "Nebe je modré."],
  ["giallo", "žlutý", "džálo", "Il sole è giallo.", "Slunce je žluté."],
  ["verde", "zelený", "vérde", "L'erba è verde.", "Tráva je zelená."],
  ["nero", "černý", "néro", "Il gatto è nero.", "Kočka je černá."],
  ["bianco", "bílý", "bjánko", "La neve è bianca.", "Sníh je bílý."],
  ["grigio", "šedý", "grídžo", "Il topo è grigio.", "Myš je šedá."],
  ["marrone", "hnědý", "maróne", "Il tronco è marrone.", "Kmen je hnědý."],
  ["arancione", "oranžový", "arančóne", "L'arancia è arancione.", "Pomeranč je oranžový."],
  ["viola", "fialový", "vióla", "Il fiore è viola.", "Květina je fialová."],
  ["rosa", "růžový", "róza", "Il maiale è rosa.", "Prase je růžové."],
  ["azzurro", "světle modrý", "adzúro", "L'acqua è azzurra.", "Voda je světle modrá."],
  ["celeste", "nebesky modrý", "čeléste", "Il vestito è celeste.", "Šaty jsou nebesky modré."],
  ["oro", "zlatý", "óro", "L'anello è d'oro.", "Prsten je zlatý."],
  ["argento", "stříbrný", "ardžénto", "La moneta è d'argento.", "Mince je stříbrná."],
  ["chiaro", "světlý", "kjáro", "È un verde chiaro.", "Je to světle zelená."],
  ["scuro", "tmavý", "skúro", "È un blu scuro.", "Je to tmavě modrá."]
];

const cas = [
  ["lunedì", "pondělí", "lunedí", "Oggi è lunedì.", "Dnes je pondělí."],
  ["martedì", "úterý", "martedí", "Domani è martedì.", "Zítra je úterý."],
  ["mercoledì", "středa", "merkoledí", "Mercoledì vado al cinema.", "Ve středu jdu do kina."],
  ["giovedì", "čtvrtek", "džovedí", "Giovedì lavoro.", "Ve čtvrtek pracuji."],
  ["venerdì", "pátek", "venerdí", "Venerdì inizia il weekend.", "V pátek začíná víkend."],
  ["sabato", "sobota", "sábato", "Sabato riposo.", "V sobotu odpočívám."],
  ["domenica", "neděle", "doménika", "Domenica vado in chiesa.", "V neděli jdu do kostela."],
  ["gennaio", "leden", "dženájo", "Gennaio è freddo.", "Leden je studený."],
  ["febbraio", "únor", "febrájo", "Febbraio è corto.", "Únor je krátký."],
  ["marzo", "březen", "márco", "Marzo è pazzo.", "Březen je bláznivý."],
  ["aprile", "duben", "apríle", "Aprile dolce dormire.", "V dubnu se sladce spí."],
  ["maggio", "květen", "mádžo", "Maggio è bello.", "Květen je krásný."],
  ["giugno", "červen", "džúňo", "A giugno finisce la scuola.", "V červnu končí škola."],
  ["luglio", "červenec", "lúljo", "A luglio fa caldo.", "V červenci je horko."],
  ["agosto", "srpen", "agósto", "Vado in vacanza ad agosto.", "Jedu na dovolenou v srpnu."],
  ["settembre", "září", "setémbre", "A settembre ricomincia la scuola.", "V září začíná znovu škola."],
  ["ottobre", "říjen", "otóbre", "Le foglie cadono a ottobre.", "Listí padá v říjnu."],
  ["novembre", "listopad", "novémbre", "Novembre è piovoso.", "Listopad je deštivý."],
  ["dicembre", "prosinec", "dičémbre", "A dicembre c'è Natale.", "V prosinci jsou Vánoce."],
  ["oggi", "dnes", "ódži", "Oggi piove.", "Dnes prší."],
  ["domani", "zítra", "dománi", "Domani vado a Roma.", "Zítra jedu do Říma."],
  ["ieri", "včera", "jéri", "Ieri sono andato al cinema.", "Včera jsem šel do kina."],
  ["la mattina", "ráno", "la matína", "Mi alzo presto la mattina.", "Vstávám brzy ráno."],
  ["il pomeriggio", "odpoledne", "il pomerídžo", "Lavoro nel pomeriggio.", "Pracuji odpoledne."],
  ["la sera", "večer", "la séra", "La sera guardo la TV.", "Večer se dívám na TV."],
  ["la notte", "noc", "la nóte", "La notte dormo.", "V noci spím."],
  ["l'ora", "hodina", "lóra", "Che ora è?", "Kolik je hodin?"],
  ["il minuto", "minuta", "il minúto", "Aspetta un minuto.", "Počkej minutu."],
  ["il secondo", "sekunda", "il sekóndo", "Un secondo, per favore.", "Sekundu, prosím."],
  ["la settimana", "týden", "la setimána", "Una settimana ha sette giorni.", "Týden má sedm dní."],
  ["il mese", "měsíc", "il méze", "Il prossimo mese.", "Příští měsíc."],
  ["l'anno", "rok", "láno", "Buon anno!", "Šťastný nový rok!"],
  ["la primavera", "jaro", "la primavéra", "In primavera sbocciano i fiori.", "Na jaře kvetou květiny."],
  ["l'estate", "léto", "lestáte", "In estate fa caldo.", "V létě je horko."],
  ["l'autunno", "podzim", "lautúno", "In autunno cadono le foglie.", "Na podzim padá listí."],
  ["l'inverno", "zima (období)", "linvérno", "In inverno fa freddo.", "V zimě je zima."]
];

addWords("Počasí", "A1", pocasi);
addWords("Barvy", "A1", barvy);
addWords("Čas a dny", "A1", cas);

fs.writeFileSync(path.join(__dirname, 'massive_words.json'), JSON.stringify(words, null, 2));
console.log(`Generated ${words.length} massive words!`);
