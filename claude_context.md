# DebtHacker - Projektöversikt och Kontext

Detta dokument är skapat för att ge en AI-assistent (som Claude) fullständig kontext om DebtHacker-projektet, dess filstruktur, tillstånd och funktionalitet, för att snabbt kunna bygga vidare på kodbasen.

## 1. Projektbeskrivning
Appen "DebtHacker" är ett privatekonomiskt verktyg fokuserat på att hjälpa användare att betala av sina skulder snabbare och bygga en stabil ekonomisk framtid. Metodiken bygger starkt på David Bachs "DOLP"-metod (Done On Last Payment) där användaren skapar en "snöbollseffekt" genom att fokusera på minsta skulden först, oavsett ränta, för psykologiskt momentum.

Utöver skuldbetalning innehåller appen verktyg för:
- **Samlån (Consolidation):** En kalkylator för att se besparingar av samlån, som inledningsvis är *låst* tills användaren bevisat beteendeförändring (klippt kort, betalat extra) för att undvika fällan med ny skuld ovanpå gamla lån.
- **Sparhinkar (Buckets):** Automatisering av sparande uppdelat i Pension (12.5%), Buffert (5%) och Dröm (5%) av månadsinkomsten, med ränta-på-ränta visualisering (30 år).
- **Prenumerationsjakt (Subs):** Ett verktyg och guidad process för att hitta och säga upp onödiga abonnemang för att frigöra kassaflöde.
- **Ekonomicoach (AI):** Ett chattränssnitt som ska kopplas mot ett AI-API (t.ex. Claude) för att agera privatekonomisk rådgivare i appen.

## 2. Teknikstack
- **Ramverk:** React 19 (använder JSX och Hooks) med Vite som byggverktyg.
- **Styling:** Inline CSS (inga externa CSS-bibliotek som Tailwind eller Bootstrap används i själva React-komponenterna, utom eventuellt `index.css` för globala overrides). Ett centralt `S`-objekt (Style-objekt) i `DebtHacker.jsx` hanterar mycket av den återanvändbara stylingen.
- **Ikoner:** Anpassad SVG-komponent (`Icon`) integrerad direkt i koden.
- **Persistens:** För tillfället lagras all data enbart i Reacts lokala state (nollställs vid sidladdning).

## 3. Filstruktur

Projektet ligger i `/Users/christianwederbrand/.gemini/antigravity/scratch/debthacker/`.

- `package.json`: Definierar Vite och React som beroenden.
- `index.html`: Standard Vite entrypoint som laddar `src/main.jsx`.
- `src/main.jsx`: Bootstrappar React-appen och renderar `<App />`.
- `src/index.css`: Globala stilar för appen.
- `src/App.jsx`: Ansvarar för huvudlayouten (Desktop Sidebar vs Mobile Bottom Bar) och hanterar navigering mellan flikar (`activeTab`).
- `src/DebtHacker.jsx`: **Huvudfilen** (~912 rader). Innehåller all kärnlogik, state och UI-komponenter för de olika vyerna.

## 4. Kärnfilen: `src/DebtHacker.jsx`

Denna fil är väldigt stor och innehåller flera inre komponenter. Här är en nedbrytning:

### State Management (`useState`)
Komponenten `DebtHacker` hanterar följande huvudsakliga tillstånd:
- `debts`: Array med objekt (`{ id, name, balance, interest_rate, min_payment, paid_off }`).
- `extraPayment`: Användarens angivna extra amortering per månad (Slider).
- `monthlyIncome`: Användarens angivna månadsinkomst.
- `subscriptions`: Array med aktiva och inaktiva prenumerationer.
- `behaviorProof`: Objekt (`{ cardClosed, extraPayments, noCreditDays }`). Används för att bedöma om användaren förtjänat att låsa upp Samlåns-kalkylatorn.
- `consolidationRate`: Den ränta användaren vill jämföra sitt samlån med.
- `chatMessages` och `chatInput`: Hanterar chattgränssnittet för Ekonomicoachen.

### Hjälpfunktioner (Logik & Beräkning)
- `calculateDOLPOrder(debts)`: Sorterar arrayen med skulder på lägst `balance` först.
- `calculatePayoffPlan(debts, extraPayment)`: Simulerar avbetalningar månad för månad. Det frigjorda kapitalet från en betald skuld flyttas över till nästa skuld (Snöbollseffekten). Returnerar en "plan" array.
- `calculateConsolidationSavings(debts, newRate)`: Beräknar nuvarande totalränta jämfört med räntan vid ett nytt, samlat lån för att visa potentiell besparing och ny månadskostnad.
- `calculateCompoundGrowth(monthly, years, rate)`: Beräknar exponentiell tillväxt över tid, används i "Hinkar"-vyn och visualiseras av komponenten `MiniCompoundChart`.

### Underkomponenter (Vyer)
Filen använder "inline components" (komponenter definierade inuti `DebtHacker`-funktionen) för de olika flikarna:
1. **`Dashboard`**: Översiktsvy med nyckeltal (Total skuld, månader till skuldfrihet) och genvägar till andra vyer. Innehåller slider för `extraPayment`.
2. **`DOLPView`**: Vyn för "Skulder". Listar alla skulder sorterade enligt DOLP. Visar progress bars baserat på uträknad payoff-plan. Gör det möjligt att markera skulder som "Paid off" (✅) eller ta bort dem (🗑️) samt formulär för att lägga till nya.
3. **`ConsolidationView`**: Vyn för "Samlån". Ett utbildande gränssnitt.
   - Visar ett **Samlånslås**: Användaren måste bocka av uppgifter (t.ex. "Stängt minst ett kort") i `behaviorProof` state innan de får se kalkylatorn. En blur-effekt döljer kalkylatorn innan upplåsning.
   - Visar `<UnlockCeremony>` (en modal) när kraven är uppfyllda, där användaren måste lova att inte skuldsätta sig igen.
   - Om upplåst: Visar en jämförelse mellan nuvarande ränta och potentiell ränta på ett samlån baserat på `consolidationRate` slider.
4. **`BucketsView`**: Vyn för "Hinkar" (Sparande). Fördelar `monthlyIncome` i olika sparmål och visar vad detta blir om 30 år med ränta-på-ränta (visas grafiskt via `MiniCompoundChart`).
5. **`SubsView`**: Vyn för prenumerationer. Visar kostnad för aktiva prenumerationer och beräknad frigjord framtida tillväxt av uppsagda (cancelled) prenumerationer.
   - Innehåller modulen **`<HuntGuide />`**: En flerstegs checklista (mobil, bank, kort, mail) för hur man hittar glömda prenumerationer.
6. **AI Coach (Chattlogik)**: Funktionen `sendMessage` bygger en kontext-sträng (`ctx`) baserad på användarens nuvarande skulder, inkomst och framsteg, och skickar detta + chattmeddelandet i ett POST JSON-anrop mot `"/api/claude"`. (Denna endpoint finns dock inte implementerad i projektet än).

## 5. Vad ska (eller kan) göras härnäst?

När du (Claude) tar över för att bygga vidare, här är de mest logiska nästa stegen och områden som behöver förbättras:

1. **Datapersistens (Viktigast för MVP):**
   - Just nu lever all data bara i minnet. Om användaren laddar om sidan försvinner deras skulder och inställningar.
   - *Uppgift:* Implementera `localStorage` i `App.jsx` eller `DebtHacker.jsx` via `useEffect` så att appen kommer ihåg lagd data lokalt i webbläsaren.
   - Eller integrera mot en databas (t.ex. Supabase).

2. **Backend för AI-Coachen:**
   - Chatten gör just nu ett `fetch` mot `/api/claude`. Vite serverar frontend, så detta API-anrop failar och chatten faller tillbaka på ett default-meddelande ("Håll kursen! Minsta skuld alltid först.").
   - *Uppgift:* Skapa en Edge Function i Supabase eller en serverless funktion (Vercel/Netlify) som tar emot prompten, kommunicerar korrekt med Anthropic/OpenAI, och skickar tillbaka svaret. Uppdatera fetch-url:en i koden.

3. **Refaktorisering:**
   - `DebtHacker.jsx` är på över 900 rader. "Inline"-komponenterna (som `const Dashboard = () => (...)`) renderas om varje gång huvudkomponenten renderas, vilket inte är optimalt prestandamässigt, och filen är otymplig att läsa.
   - *Uppgift:* Bryt ut `Dashboard`, `DOLPView`, `ConsolidationView`, `BucketsView` och `SubsView` till egna filer i en `src/components/`-mapp och skicka states som props istället. Cachen med `calculate...`-funktionerna kan flyttas till en `utils.js` fil.

4. **Förbättringar av UX/Funktionalitet:**
   - Lägga till en varning (Confirmation Dialog) innan användaren råkar radera en skuld.
   - Polera CSS (transitions/animations) vid flikbyten, eventuellt implementera Framer Motion för smidigare navigering i appen.
   - Tillåta användaren att redigera existerande skulder/prenumerationer (just nu kan de bara lägga till eller ta bort).

---
*Använd detta dokument som referens när du hjälper utvecklaren att bygga vidare på kodbasen.*
