# Italo - iOS Aplikace

Tato aplikace používá [Capacitor](https://capacitorjs.com) pro kompilaci existujícího React frontendu do nativní iOS aplikace.

## Zvolená architektura: Wi-Fi API (Možnost A)
Appka poběží jako nativní iOS aplikace, ale API volání směřuje na server (ve výchozím nastavení musí běžet na stejném lokálním PC a telefon musí být na stejné Wi-Fi síti).

### Nastavení server URL pro iOS
Když budeš chtít zkompilovat appku pro reálný telefon, musíš nejdřív změnit v `frontend/src/utils/api.ts` base URL tak, aby neukazovala na `/api/...`, ale na skutečnou IP adresu tvého Macu v domácí síti (např. `http://192.168.1.100:3000/api/...`).
To můžeš udělat tak, že v `api.ts` změníš URL před posláním requestu:
```typescript
const BASE_URL = 'http://TVOJE_MAC_IP_ZDE:3000';
const finalUrl = url.startsWith('/api') ? `${BASE_URL}${url}` : url;
const response = await fetch(finalUrl, finalOptions);
```

*(Nezapomeň to vrátit zpět, když budeš testovat na počítači/Dockeru).*

## Jak zkompilovat a spustit na iOS

1. **Build webové verze:**
   Běž do složky `frontend` a spusť produkční build.
   ```bash
   cd frontend
   npm run build
   ```

2. **Přidání iOS platformy (pouze poprvé):**
   ```bash
   npx cap add ios
   ```

3. **Synchronizace buildnutého webu do iOS projektu:**
   Vždy když změníš něco v React kódu a uděláš `npm run build`, musíš spustit sync.
   ```bash
   npx cap sync ios
   ```

4. **Otevření v Xcode:**
   Otevře existující Xcode projekt.
   ```bash
   npx cap open ios
   ```
   
5. **V Xcode:**
   - Připoj svůj iPhone přes kabel (nebo použij Simulátor).
   - Zvol ho jako cíl nahoře na liště.
   - Klikni na velké tlačítko "Play" (Run).
   - V záložce "Signing & Capabilities" budeš možná muset vybrat svůj Apple ID účet, aby Apple dovolil instalaci na tvůj telefon (Development Profile).
