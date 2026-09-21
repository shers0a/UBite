# UBite — Rezumat pentru echipa de proiect

*Document în limba română, pentru Andra, Nae, Lemnaru și pentru discuțiile cu DCCAS și UNIHUB.
Restul documentației este tehnică și în engleză.*

---

## Ce construim

O aplicație web care se instalează pe telefon ca o aplicație obișnuită (funcționează și pe
iPhone, și pe Android, dintr-un singur cod). Studentul deschide aplicația și află în două
secunde două lucruri: **cât e de aglomerat la cantină acum** și **ce e în meniul de azi**.

Cele cinci funcționalități asumate în fișă (R2):

1. Meniul zilei cu prețuri
2. Informații despre preparate — gramaj, alergeni, categorii (vegetarian, de post)
3. Gradul de aglomerare — redus / moderat / ridicat, plus timpul estimat de așteptare
4. Fidelizare „5 meniuri + 1 gratuit"
5. Feedback și notificări

Pe lângă ele, echipa tehnică a confirmat încă paisprezece funcționalități: predicția
aglomerației pe ore, raportări de la studenți, preparate favorite cu alertă, filtre
alimentare, note pentru preparate, istoric personal de cheltuieli, dashboard pentru DCCAS,
analiză de risipă alimentară, anunțuri, română și engleză, funcționare fără internet și
altele.

**Data țintă de lansare: 13 octombrie.**

---

## De ce avem nevoie de la voi

Astea sunt singurele lucruri care pot opri proiectul. Fiecare e un email sau o discuție.

### Urgent — săptămâna asta

| Ce | De la cine | De ce |
|---|---|---|
| **Rezultatele brute ale formularului** pe care l-ai dat studenților | Andra | E singura cercetare reală de utilizatori care există deja, iar echipa tehnică nu a văzut-o niciodată |
| **Cine este Ofițerul de Protecție a Datelor (DPO) al UB** | Andra | Fără avizul lui, camera nu poate funcționa legal. Nimeni nu a vorbit cu el încă |
| **Confirmare scrisă că UB este operatorul de date** | Andra | Altfel trei studenți răspund personal pentru datele a mii de studenți |
| **Documentul Google cu etapele** trimis pe 19 septembrie | Andra | Echipa tehnică nu l-a primit |

### Înainte de lansare

| Ce | De la cine |
|---|---|
| Confirmare **scrisă** că DCCAS cumpără camerele, cu termen | Cîrciumaru |
| Acord **scris** pentru fidelizare — cine suportă masa gratuită | Cîrciumaru |
| Permisiune de montare a camerei și a tabletei | Cîrciumaru |
| Specificațiile serverului UB și acces efectiv | Rareș Cristea |
| Subdomeniul `ubite.unibuc.ro` | Rareș Cristea |

Lista completă, cu responsabil și termen pentru fiecare, e în `17-open-questions.md`.

---

## Ce e deja rezolvat, ca să nu ne blocăm

Echipa tehnică a proiectat aplicația astfel încât **niciuna dintre întârzierile de mai sus să
nu oprească lansarea**:

- **Dacă serverul UB întârzie** — pornim pe găzduire gratuită și migrăm după. Zero cost, zero
  așteptare.
- **Dacă autentificarea instituțională întârzie** — studentul primește un cod pe adresa
  `@s.unibuc.ro`. Se face într-o zi.
- **Dacă nu vin camerele** — gradul de aglomerare se calculează din raportările studenților și
  din istoricul orelor aglomerate. Fișa cere *estimarea* aglomerației, nu o cameră anume, deci
  obiectivul O.2 rămâne îndeplinit.
- **Dacă fidelizarea nu se poate integra la casă** — aplicația contorizează vizitele, iar DCCAS
  acordă premiul manual. R13, R14 și R15 se livrează oricum.

---

## Ce trebuie să știe DCCAS despre fidelizare

Cifrele concrete, pentru discuția cu domnul Cîrciumaru:

- Un meniu complet costă aproximativ **10 lei**
- „5 cumpărate + al 6-lea gratuit" înseamnă **~10 lei oferiți la ~50 lei cheltuiți**
- Cu cei 50 de studenți asumați în R14, pe două săptămâni și jumătate de pilot, expunerea
  totală e de **câteva sute de lei**
- Dashboard-ul îi arată exact câte mese gratuite s-au dat, în timp real

În schimb, DCCAS primește ceva ce nu a avut niciodată: câți studenți intră pe zi și pe interval
orar, ce preparate sunt apreciate și care nu, și feedback-ul studenților, agregat.

---

## Riscurile reale, pe scurt

| Risc | Ce facem |
|---|---|
| **Avizul DPO pentru cameră** | Nu stocăm nicio imagine — doar numărul de persoane. Cerem avizul din timp |
| **Angajații cantinei nu introduc meniul** | Ecranul e conceput să dureze sub două minute. Dacă nu intră trei zile, intervenim noi |
| **Camerele nu vin** | Funcționăm fără ele, cum e explicat mai sus |
| **Sunt multe funcționalități pentru cinci săptămâni** | Cele cinci din fișă sunt protejate. Restul se livrează în ordinea importanței |

---

## Ce ar ajuta și nu costă nimic

1. **ASMI** nu are niciun rol formal în proiect. E o asociație studențească la exact facultatea
   celor trei dezvoltatori — ar putea ajuta enorm la promovare pentru cei 300 de studenți și ar
   putea prelua mentenanța după 31 octombrie.
2. **R16** (planul de sustenabilitate) și **R17** (propunerea de parteneriat cu mediul de
   afaceri) sunt documente, nu software. Se pot scrie **acum**, înainte ca aplicația să existe.
   R17 nu a fost discutat niciodată de nimeni, deși e asumat în fișa semnată.
3. **Materialele de promovare** (R10) se pot proiecta și tipări înainte de lansare. Afișele cu
   cod QR puse chiar în cantină sunt cel mai eficient canal pe care îl avem.

---

## Vestea bună

Cantina servește aproximativ **1.000 de persoane pe zi**. Ținta de 300 de studenți din R9
înseamnă cam **23 de utilizatori noi pe zi de funcționare** — adică sub 3% din fluxul zilnic.

Este perfect realizabil doar din afișele puse în cantină, înainte de orice altă promovare.
