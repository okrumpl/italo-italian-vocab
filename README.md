# Italo - Výuka italských slovíček (Duolingo Style)

Tato aplikace slouží k efektivnímu učení italských slovíček pro české uživatele. Aplikace využívá **Leitnerův systém (Spaced Repetition)** pro chytré plánování opakování a je optimalizována pro mobilní telefony, abyste se mohli učit pohodlně na cestách.

Aplikace je inspirována populárním Duolingem a obsahuje:
- **Interaktivního maskota "Italo" (sova)**, který reaguje na vaše úspěchy a chyby.
- **Denní série (streak)**, celkové skóre (XP) a úrovně (Levely).
- **Různé druhy cvičení**: Výběr z možností, přiřazování dvojic (matching), psaní překladů a skládání celých vět.
- **Syntézu italské výslovnosti (TTS)** a dynamické zvukové efekty (Web Audio).
- **Kompletní vyhledávací slovník** s přehledem postupu učení.
- **Statistiky a krabičky pokroku** (Leitnerův systém 1–5).

---

## Rychlé spuštění v Dockeru

Aplikace je plně kontejnerizovaná a připravená pro provoz na macOS (i jiných OS) s persistencí databáze pokroku.

### 1. Spuštění kontejneru
V kořenovém adresáři projektu spusťte v terminálu příkaz:

```bash
docker compose up -d --build
```

Tento příkaz:
- Stáhne a zkompiluje React frontend.
- Spustí Express server na portu `3000`.
- Vytvoří lokální složku `./data` ve vašem projektu, kam se bude trvale ukládat SQLite databáze. Váš pokrok se nesmaže ani při restartu nebo aktualizaci kontejneru.

### 2. Otevření aplikace

- **Na počítači (Mac):** Otevřete prohlížeč na adrese [http://localhost:3000](http://localhost:3000).
- **Na telefonu (ve stejné Wi-Fi síti):** 
  1. Zjistěte IP adresu svého Macu v lokální síti. V terminálu můžete spustit:
     ```bash
     ipconfig getifaddr en0
     ```
     *(Například to vrátí adresu `192.168.1.100`)*
  2. Na svém telefonu otevřete prohlížeč a zadejte: `http://<IP_ADRESA_MACU>:3000` (např. `http://192.168.1.100:3000`).

---

## Správa kontejneru

- **Zastavení aplikace:**
  ```bash
  docker compose down
  ```
- **Zobrazení logů běžící aplikace:**
  ```bash
  docker compose logs -f
  ```
- **Úplný restart a znovusestavení:**
  ```bash
  docker compose up -d --build --force-recreate
  ```

---

## Lokální vývoj (bez Dockeru)

Pokud chcete aplikaci spouštět lokálně mimo Docker:

1. Nainstalujte závislosti pro kořen, backend i frontend:
   ```bash
   npm run install-all
   ```
2. Spusťte backend i frontend současně v dev režimu:
   ```bash
   npm run dev
   ```
   - Frontend poběží na `http://localhost:5173` (s automatickým proxy na backend).
   - Backend poběží na `http://localhost:3000`.
