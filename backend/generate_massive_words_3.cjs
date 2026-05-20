const fs = require('fs');
const path = require('path');

const words = [];

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

// 1. Počasí (doplnění na 30+)
const pocasi2 = [
  ["la pioggerella", "mrholení", "la pjodžeréla", "C'è una pioggerella leggera.", "Je lehké mrholení."],
  ["la brina", "jinovatka", "la brína", "La brina copre i campi.", "Jinovatka pokrývá pole."],
  ["la tempesta", "bouře", "la tempésta", "La tempesta è forte.", "Bouře je silná."],
  ["il tornado", "tornádo", "il tornádo", "Il tornado distrugge tutto.", "Tornádo ničí všechno."],
  ["la siccità", "sucho", "la sičitá", "La siccità dura da mesi.", "Sucho trvá měsíce."],
  ["l'alluvione", "povodeň", "laluvjóne", "L'alluvione ha danneggiato la città.", "Povodeň poškodila město."],
  ["la brezza", "vánek", "la bréca", "Una brezza fresca soffia.", "Fouká svěží vánek."],
  ["la rugiada", "rosa (kapky)", "la rudžáda", "La rugiada brilla sull'erba.", "Rosa se třpytí na trávě."],
  ["il ciclone", "cyklón", "il čiklóne", "Il ciclone si avvicina.", "Cyklón se blíží."],
  ["piovere", "pršet", "pjóvere", "Domani pioverà.", "Zítra bude pršet."],
  ["nevicare", "sněžit", "nevikáre", "Ha iniziato a nevicare.", "Začalo sněžit."],
  ["gelare", "mrznout", "dželáre", "Di notte gela.", "V noci mrzne."],
  ["soffiare", "foukat", "sofjáre", "Il vento soffia forte.", "Vítr fouká silně."],
  ["la previsione", "předpověď", "la previzjóne", "La previsione dice sole.", "Předpověď říká slunečno."],
  ["il termometro", "teploměr", "il termómetro", "Il termometro segna 30 gradi.", "Teploměr ukazuje 30 stupňů."],
  ["il grado", "stupeň", "il grádo", "Oggi ci sono 25 gradi.", "Dnes je 25 stupňů."],
  ["asciutto", "suchý", "ašúto", "Il tempo è asciutto.", "Počasí je suché."],
  ["umido", "vlhký", "úmido", "L'aria è molto umida.", "Vzduch je velmi vlhký."],
  ["piovoso", "deštivý", "pjovózo", "Una giornata piovosa.", "Deštivý den."],
  ["soleggiato", "slunečný", "soledžáto", "Un giorno soleggiato.", "Slunečný den."],
  ["ventoso", "větrný", "ventózo", "Una notte ventosa.", "Větrná noc."]
];

// 2. Město a doprava (doplnění na 40+)
const mesto2 = [
  ["la città", "město", "la čitá", "La città è grande.", "Město je velké."],
  ["il paese", "vesnice / země", "il paéze", "Il paese è piccolo.", "Vesnice je malá."],
  ["la piazza", "náměstí", "la pjáca", "La piazza è bella.", "Náměstí je hezké."],
  ["la via", "ulice", "la vía", "La via è stretta.", "Ulice je úzká."],
  ["il marciapiede", "chodník", "il marčapjéde", "Cammino sul marciapiede.", "Jdu po chodníku."],
  ["l'incrocio", "křižovatka", "linkróčo", "Gira a destra all'incrocio.", "Zahni vpravo na křižovatce."],
  ["il semaforo", "semafor", "il semáforo", "Il semaforo è rosso.", "Semafor je červený."],
  ["la fermata", "zastávka", "la fermáta", "La fermata dell'autobus.", "Zastávka autobusu."],
  ["il ponte", "most", "il pónte", "Il ponte è antico.", "Most je starý."],
  ["il palazzo", "palác / budova", "il paláco", "Il palazzo è enorme.", "Budova je obrovská."],
  ["il municipio", "radnice", "il muničípio", "Il municipio è in centro.", "Radnice je v centru."],
  ["la chiesa", "kostel", "la kjéza", "La chiesa è del XV secolo.", "Kostel je z 15. století."],
  ["la fontana", "fontána", "la fontána", "La fontana è bellissima.", "Fontána je nádherná."],
  ["il supermercato", "supermarket", "il supermerkáto", "Vado al supermercato.", "Jdu do supermarketu."],
  ["la farmacia", "lékárna", "la farmačía", "La farmacia è aperta.", "Lékárna je otevřená."],
  ["la banca", "banka", "la bánka", "Devo andare in banca.", "Musím jít do banky."],
  ["l'ospedale", "nemocnice", "lospedále", "L'ospedale è vicino.", "Nemocnice je blízko."],
  ["la scuola", "škola", "la skuóla", "La scuola inizia a settembre.", "Škola začíná v září."],
  ["la biblioteca", "knihovna", "la bibliotéka", "Studio in biblioteca.", "Studuji v knihovně."],
  ["il ristorante", "restaurace", "il ristoránte", "Il ristorante è buono.", "Restaurace je dobrá."],
  ["il bar", "bar / kavárna", "il bar", "Prendiamo un caffè al bar.", "Dáme si kávu v baru."],
  ["la posta", "pošta", "la pósta", "Vado alla posta.", "Jdu na poštu."],
  ["il taxi", "taxík", "il táksi", "Chiamo un taxi.", "Volám taxík."],
  ["la metropolitana", "metro", "la metropolitána", "Prendo la metropolitana.", "Jedu metrem."],
  ["il tram", "tramvaj", "il tram", "Il tram è in ritardo.", "Tramvaj má zpoždění."],
  ["la bicicletta", "kolo", "la bičikléta", "Vado in bicicletta al lavoro.", "Jezdím na kole do práce."],
  ["il motorino", "skútr", "il motoríno", "Ho un motorino nuovo.", "Mám nový skútr."],
  ["il pedone", "chodec", "il pedóne", "Il pedone attraversa la strada.", "Chodec přechází silnici."],
  ["il traffico", "provoz / doprava", "il tráfiko", "Il traffico è intenso.", "Provoz je hustý."],
  ["il parcheggio", "parkoviště", "il parkédžo", "Cerco un parcheggio.", "Hledám parkoviště."],
  ["la patente", "řidičský průkaz", "la paténte", "Ho preso la patente.", "Udělal jsem si řidičák."],
  ["la multa", "pokuta", "la múlta", "Ho preso una multa.", "Dostal jsem pokutu."],
  ["la rotonda", "kruhový objezd", "la rotónda", "Vai dritto alla rotonda.", "Jeď rovně na kruháči."]
];

// 3. Emoce a vlastnosti (doplnění na 40+)
const emoce2 = [
  ["felice", "šťastný", "felíče", "Sono molto felice.", "Jsem velmi šťastný."],
  ["triste", "smutný", "tríste", "Perché sei triste?", "Proč jsi smutný?"],
  ["arrabbiato", "naštvaný", "arabjáto", "Sono arrabbiato.", "Jsem naštvaný."],
  ["sorpreso", "překvapený", "sorprézo", "Sono sorpreso!", "Jsem překvapený!"],
  ["preoccupato", "ustaraný", "preokupáto", "Sono preoccupato per te.", "Mám o tebe starost."],
  ["spaventato", "vystrašený", "spaventáto", "Il bambino è spaventato.", "Dítě je vystrašené."],
  ["entusiasta", "nadšený", "entuzjásta", "Sono entusiasta del viaggio.", "Jsem nadšený z výletu."],
  ["deluso", "zklamaný", "delúzo", "Sono deluso dal risultato.", "Jsem zklamaný z výsledku."],
  ["geloso", "žárlivý", "dželózo", "Non essere geloso.", "Nebuď žárlivý."],
  ["orgoglioso", "hrdý / pyšný", "orgoljózo", "Sono orgoglioso di te.", "Jsem na tebe hrdý."],
  ["annoiato", "znuděný", "anojáto", "Mi sento annoiato.", "Cítím se znuděný."],
  ["emozionato", "vzrušený / dojatý", "emocjonáto", "Sono emozionato.", "Jsem dojatý."],
  ["confuso", "zmatený", "konfúzo", "Sono confuso.", "Jsem zmatený."],
  ["nervoso", "nervózní", "nervózo", "Non essere nervoso.", "Nebuď nervózní."],
  ["calmo", "klidný", "kálmo", "Stai calmo.", "Buď klidný."],
  ["coraggioso", "odvážný", "koradžózo", "Sei molto coraggioso.", "Jsi velmi odvážný."],
  ["timido", "stydlivý", "tímido", "È un ragazzo timido.", "Je to stydlivý kluk."],
  ["gentile", "laskavý", "džentíle", "Lei è molto gentile.", "Ona je velmi laskavá."],
  ["generoso", "štědrý", "dženerózo", "Un uomo generoso.", "Štědrý muž."],
  ["pigro", "líný", "pígro", "Il gatto è pigro.", "Kočka je líná."],
  ["furbo", "mazaný / chytrý", "fúrbo", "È un tipo furbo.", "Je to mazaný typ."],
  ["testardo", "tvrdohlavý", "testárdo", "È molto testardo.", "Je velmi tvrdohlavý."],
  ["simpatico", "sympatický", "simpátiko", "È una persona simpatica.", "Je to sympatický člověk."],
  ["antipatico", "nesympatický", "antipátiko", "Non è antipatico, solo timido.", "Není nesympatický, jen stydlivý."],
  ["sincero", "upřímný", "sinčéro", "Sii sincero con me.", "Buď ke mně upřímný."],
  ["onesto", "poctivý", "onésto", "È un uomo onesto.", "Je to poctivý muž."],
  ["paziente", "trpělivý", "pacjénte", "Devi essere paziente.", "Musíš být trpělivý."],
  ["impaziente", "netrpělivý", "impacjénte", "Sono impaziente di vederti.", "Netrpělivě se těším, až tě uvidím."],
  ["curioso", "zvědavý", "kurjózo", "I bambini sono curiosi.", "Děti jsou zvědavé."],
  ["divertente", "zábavný", "diverténte", "Il film è divertente.", "Film je zábavný."]
];

// 4. Barvy (doplnění na 30+)
const barvy2 = [
  ["turchese", "tyrkysový", "turkéze", "Il mare è turchese.", "Moře je tyrkysové."],
  ["lilla", "lila", "líla", "Un vestito lilla.", "Šaty lila barvy."],
  ["beige", "béžový", "béž", "I pantaloni beige.", "Béžové kalhoty."],
  ["bordeaux", "bordó", "bordó", "Una cravatta bordeaux.", "Bordó kravata."],
  ["crema", "krémový", "kréma", "Il colore crema.", "Krémová barva."],
  ["indaco", "indigový", "índako", "Il cielo indaco.", "Indigová obloha."],
  ["corallo", "korálový", "korálo", "Un rossetto corallo.", "Korálová rtěnka."],
  ["color salmone", "lososový", "kolór salmóne", "La maglietta color salmone.", "Tričko lososové barvy."],
  ["brillante", "zářivý", "briljánte", "Un rosso brillante.", "Zářivě červená."],
  ["opaco", "matný", "opáko", "Una vernice opaca.", "Matný lak."],
  ["colorato", "barevný", "koloráto", "Un mondo colorato.", "Barevný svět."],
  ["trasparente", "průhledný", "trasparénte", "L'acqua è trasparente.", "Voda je průhledná."],
  ["dipingere", "malovat", "dipíndžere", "Mi piace dipingere.", "Rád maluji."],
  ["il colore", "barva", "il kolóre", "Qual è il tuo colore preferito?", "Jaká je tvá oblíbená barva?"]
];

// 5. Rodina a vztahy (doplnění na 40+)
const rodina2 = [
  ["il bisnonno", "pradědeček", "il biznóno", "Il bisnonno ha 95 anni.", "Pradědeček má 95 let."],
  ["la bisnonna", "prababička", "la biznóna", "La bisnonna racconta storie.", "Prababička vypráví příběhy."],
  ["il suocero", "tchán", "il suóčero", "Il suocero è simpatico.", "Tchán je sympatický."],
  ["la suocera", "tchyně", "la suóčera", "La suocera cucina bene.", "Tchyně dobře vaří."],
  ["il genero", "zeť", "il džénero", "Il genero lavora in banca.", "Zeť pracuje v bance."],
  ["la nuora", "snacha", "la nuóra", "La nuora è gentile.", "Snacha je milá."],
  ["il cognato", "švagr", "il koňáto", "Il cognato viene a cena.", "Švagr přijde na večeři."],
  ["la cognata", "švagrová", "la koňáta", "La cognata vive a Milano.", "Švagrová žije v Miláně."],
  ["il patrigno", "nevlastní otec", "il patríňo", "Il patrigno è buono.", "Nevlastní otec je hodný."],
  ["la matrigna", "nevlastní matka", "la matríňa", "La matrigna lo ama.", "Nevlastní matka ho miluje."],
  ["il gemello", "dvojče", "il džemélo", "Sono gemelli identici.", "Jsou jednovaječná dvojčata."],
  ["l'amicizia", "přátelství", "lamičícja", "L'amicizia è importante.", "Přátelství je důležité."],
  ["il fidanzato", "snoubenec / přítel", "il fidancáto", "Il fidanzato le ha proposto.", "Snoubenec jí požádal o ruku."],
  ["la fidanzata", "snoubenka / přítelkyně", "la fidancáta", "La fidanzata è bella.", "Snoubenka je krásná."],
  ["il matrimonio", "svatba", "il matrimónjo", "Il matrimonio è domani.", "Svatba je zítra."],
  ["il divorzio", "rozvod", "il divórcjo", "Il divorzio è difficile.", "Rozvod je těžký."],
  ["la nascita", "narození", "la nášita", "La nascita di un figlio.", "Narození dítěte."],
  ["il battesimo", "křest", "il batézimo", "Il battesimo del bambino.", "Křest dítěte."],
  ["la famiglia allargata", "rozšířená rodina", "la famílja alargáta", "Una grande famiglia allargata.", "Velká rozšířená rodina."],
  ["voler bene", "mít rád", "volér béne", "Ti voglio bene.", "Mám tě rád."]
];

// 6. Fráze (doplnění na 40+)
const fraze2 = [
  ["Come va?", "Jak to jde?", "kóme va", "Ciao, come va?", "Ahoj, jak to jde?"],
  ["Benissimo!", "Skvěle!", "beníssimo", "Come va? Benissimo!", "Jak to jde? Skvěle!"],
  ["Più o meno", "Tak napůl", "pjú o méno", "Come stai? Più o meno.", "Jak se máš? Tak napůl."],
  ["D'accordo", "Souhlasím / Dobrá", "dakórdo", "D'accordo, andiamo.", "Dobrá, jdeme."],
  ["Che bello!", "To je krásné!", "ke bélo", "Che bello questo posto!", "To místo je krásné!"],
  ["Non importa", "Nevadí / Na tom nezáleží", "non impórta", "Non importa, lascia stare.", "Nevadí, nech to být."],
  ["Che peccato!", "Jaká škoda!", "ke pekáto", "Che peccato che non puoi venire!", "Škoda, že nemůžeš přijít!"],
  ["In bocca al lupo!", "Hodně štěstí!", "in bóka al lúpo", "In bocca al lupo per l'esame!", "Hodně štěstí u zkoušky!"],
  ["Crepi!", "Díky! (odpověď)", "krépi", "In bocca al lupo! Crepi!", "Hodně štěstí! Díky!"],
  ["Salute!", "Na zdraví!", "salúte", "Salute! Cin cin!", "Na zdraví! Přípitek!"],
  ["Auguri!", "Blahopřání!", "augúri", "Buon compleanno! Auguri!", "Šťastné narozeniny! Blahopřání!"],
  ["Mi scusi", "Promiňte (formální)", "mi skúzi", "Mi scusi, dov'è la stazione?", "Promiňte, kde je nádraží?"],
  ["Permesso", "S dovolením", "permésso", "Permesso, posso passare?", "S dovolením, mohu projít?"],
  ["Che ora è?", "Kolik je hodin?", "ke óra é", "Scusa, che ora è?", "Promiň, kolik je hodin?"],
  ["Ho fame", "Mám hlad", "o fáme", "Ho molta fame.", "Mám velký hlad."],
  ["Ho sete", "Mám žízeň", "o séte", "Ho sete, vorrei dell'acqua.", "Mám žízeň, chtěl bych vodu."],
  ["Sono stanco", "Jsem unavený", "sóno stánko", "Sono molto stanco.", "Jsem velmi unavený."],
  ["Sto cercando", "Hledám", "sto čerkándo", "Sto cercando il museo.", "Hledám muzeum."],
  ["Vorrei", "Chtěl bych", "voréi", "Vorrei un caffè.", "Chtěl bych kávu."],
  ["Potrebbe", "Mohl byste", "potrébe", "Potrebbe aiutarmi?", "Mohl byste mi pomoci?"],
  ["Va bene", "V pořádku / Dobře", "va béne", "Va bene, ci vediamo.", "Dobře, uvidíme se."],
  ["Magari!", "Kéž by!", "magári", "Magari potessi venire!", "Kéž bych mohl přijít!"],
  ["Basta!", "Stačí!", "básta", "Basta, non ne posso più.", "Stačí, už nemůžu."],
  ["Andiamo!", "Pojďme!", "andjámo", "Dai, andiamo!", "Tak, pojďme!"],
  ["Aspetta!", "Počkej!", "aspéta", "Aspetta un momento!", "Počkej chvilku!"]
];

// 7. Oblečení a móda (doplnění na 40+)
const obleceni2 = [
  ["la felpa", "mikina", "la félpa", "La felpa è calda.", "Mikina je teplá."],
  ["il pigiama", "pyžamo", "il pidžáma", "Metto il pigiama.", "Oblékám si pyžamo."],
  ["il costume da bagno", "plavky", "il kostúme da báňo", "Porto il costume da bagno.", "Beru si plavky."],
  ["la canottiera", "nátělník / tílko", "la kanotjéra", "In estate porto la canottiera.", "V létě nosím tílko."],
  ["il giubbotto", "bunda (zimní)", "il džubóto", "Il giubbotto è impermeabile.", "Bunda je nepromokavá."],
  ["la tuta", "tepláky / overal", "la túta", "La tuta da ginnastica.", "Tepláky na cvičení."],
  ["i calzini", "ponožky", "i kalcíni", "I calzini sono sporchi.", "Ponožky jsou špinavé."],
  ["le pantofole", "bačkory", "le pantófole", "Metto le pantofole a casa.", "Doma si obouvám bačkory."],
  ["le ciabatte", "žabky (na nohy)", "le čabáte", "Le ciabatte per la spiaggia.", "Žabky na pláž."],
  ["il reggiseno", "podprsenka", "il redžiséno", "Un reggiseno sportivo.", "Sportovní podprsenka."],
  ["la moda", "móda", "la móda", "La moda cambia.", "Móda se mění."],
  ["elegante", "elegantní", "elegánte", "Un vestito elegante.", "Elegantní šaty."],
  ["sportivo", "sportovní", "sportívo", "Uno stile sportivo.", "Sportovní styl."],
  ["comodo", "pohodlný", "kómodo", "Le scarpe sono comode.", "Boty jsou pohodlné."],
  ["stretto", "úzký / těsný", "stréto", "La gonna è troppo stretta.", "Sukně je příliš těsná."],
  ["largo", "široký / volný", "largo", "I pantaloni sono larghi.", "Kalhoty jsou volné."],
  ["la taglia", "velikost (oblečení)", "la tálja", "Che taglia porti?", "Jakou nosíš velikost?"],
  ["provare", "vyzkoušet si", "prováre", "Posso provare questo?", "Mohu si toto vyzkoušet?"],
  ["lo sconto", "sleva", "lo skónto", "C'è uno sconto del 50%.", "Je sleva 50%."],
  ["il saldo", "výprodej", "il sáldo", "I saldi estivi.", "Letní výprodeje."]
];

addWords("Počasí", "A1", pocasi2);
addWords("Město a doprava", "A1", mesto2);
addWords("Emoce a vlastnosti", "A1", emoce2);
addWords("Barvy", "A1", barvy2);
addWords("Rodina a vztahy", "A1", rodina2);
addWords("Fráze", "A1", fraze2);
addWords("Oblečení a móda", "A1", obleceni2);

fs.writeFileSync(path.join(__dirname, 'massive_words_3.json'), JSON.stringify(words, null, 2));
console.log(`Generated ${words.length} additional words for underrepresented categories!`);
