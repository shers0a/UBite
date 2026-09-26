/* The in-app privacy policy (docs/11 "Required paperwork"): plain Romanian and English, drafted by
   the team from what the system actually does. The controller and the DPO come from the server's
   configuration; until UB approves the text, the page says it is a working draft. */
import { useLocation } from 'wouter';
import { AppHeader, OfflineBanner } from '@ds';
import { useI18n } from '../../i18n';
import { useApp } from '../../state/app';

export function Privacy() {
  const { t, lang } = useI18n();
  const { status } = useApp();
  const [, navigate] = useLocation();
  const p = status.data?.privacy;
  const unavailable = t('common.unavailable');
  const ro = lang === 'ro';
  return (
    <div className="ub-screen">
      <AppHeader title={t('privacy.title')} onBack={() => (window.history.length > 1 ? window.history.back() : navigate('/'))} lang={lang} />
      <main id="main" className="ub-prose" style={{ padding: '0 var(--gutter) 28px' }}>
        {!p?.approved && <OfflineBanner variant="stale" lang={lang} updatedLabel={t('privacy.draft')} />}
        {ro ? (
          <>
            <h2>Pe scurt</h2>
            <p>Meniul, coada și programul se văd fără cont și fără cookie-uri de urmărire. Contul e opțional și păstrează doar adresa de student, limba și preferința alimentară.</p>
            <h2>Cine răspunde de date</h2>
            <p>Operator: {p?.controller || unavailable}. Contact: {p?.contactEmail || unavailable}. Responsabilul cu protecția datelor: {p?.dpoEmail || unavailable}.</p>
            <h2>Camera din cantină</h2>
            <ul>
              <li>Numără persoanele din zona cozii, ca să estimeze cât aștepți. Nu recunoaște fețe și nu identifică pe nimeni.</li>
              <li>Imaginile sunt prelucrate în memorie și șterse imediat. Nu se salvează nicio imagine, nicăieri.</li>
              <li>Singurul lucru păstrat este un număr: câte persoane erau la coadă și la ce oră.</li>
            </ul>
            <h2>Bonul fiscal</h2>
            <p>Când adaugi un bon, fotografia este citită și ștearsă imediat. Păstrăm numărul bonului (transformat într-o amprentă, ca să nu poată fi folosit de două ori), data, suma și felurile de pe bon.</p>
            <h2>Ce păstrăm și cât timp</h2>
            <table>
              <thead><tr><th>Date</th><th>Cât timp</th></tr></thead>
              <tbody>
                <tr><td>Imagini de la cameră</td><td>Deloc</td></tr>
                <tr><td>Numărul de persoane la coadă</td><td>Pe durata proiectului pilot și a raportării</td></tr>
                <tr><td>Fotografia bonului</td><td>Ștearsă imediat după citire</td></tr>
                <tr><td>Amprenta bonului</td><td>Cât durează programul de fidelitate</td></tr>
                <tr><td>Rapoarte de așteptare, feedback</td><td>Pe durata pilotului și a raportării</td></tr>
                <tr><td>Contul</td><td>Până îl ștergi sau până la finalul proiectului</td></tr>
                <tr><td>Statistici de utilizare</td><td>Doar numere agregate, fără date despre persoane</td></tr>
              </tbody>
            </table>
            <h2>Statistici fără cookie-uri</h2>
            <p>Numărăm câți oameni folosesc aplicația pe zi și ce funcții folosesc, pe serverul nostru, fără cookie-uri și fără servicii terțe. Nu putem lega o vizită de alta sau de o persoană.</p>
            <h2>Drepturile tale</h2>
            <ul>
              <li>Vezi datele tale în „Contul meu”: vizitele, suma cheltuită, favoritele.</li>
              <li>Îți ștergi singur contul din „Contul meu”, fără să scrii cuiva. Notele și feedbackul rămân, fără legătură cu tine.</li>
              <li>Pentru orice altă cerere, scrie la adresa de contact de mai sus.</li>
            </ul>
            <h2>Alergeni și informații despre mâncare</h2>
            <p>Alergenii și etichetele alimentare vin de la cantină, care rămâne sursa lor. Când lipsesc, aplicația scrie „Informație indisponibilă”, niciodată „nu conține”.</p>
          </>
        ) : (
          <>
            <h2>In short</h2>
            <p>The menu, the queue and the hours are visible without an account and without tracking cookies. An account is optional and keeps only your student address, language and dietary preference.</p>
            <h2>Who is responsible</h2>
            <p>Controller: {p?.controller || unavailable}. Contact: {p?.contactEmail || unavailable}. Data protection officer: {p?.dpoEmail || unavailable}.</p>
            <h2>The camera in the canteen</h2>
            <ul>
              <li>It counts people in the queue area to estimate your wait. It does not recognise faces and identifies no one.</li>
              <li>Images are processed in memory and discarded at once. No image is stored, anywhere.</li>
              <li>The only thing kept is a number: how many people were queueing, and when.</li>
            </ul>
            <h2>The fiscal receipt</h2>
            <p>When you add a receipt, the photo is read and deleted at once. We keep the receipt number (as a fingerprint, so it cannot count twice), the date, the total and the items on it.</p>
            <h2>What we keep and for how long</h2>
            <table>
              <thead><tr><th>Data</th><th>How long</th></tr></thead>
              <tbody>
                <tr><td>Camera images</td><td>Never stored</td></tr>
                <tr><td>Queue counts</td><td>For the pilot and its reporting</td></tr>
                <tr><td>Receipt photo</td><td>Deleted right after reading</td></tr>
                <tr><td>Receipt fingerprint</td><td>For the duration of the loyalty programme</td></tr>
                <tr><td>Wait reports, feedback</td><td>For the pilot and its reporting</td></tr>
                <tr><td>Your account</td><td>Until you delete it, or the project ends</td></tr>
                <tr><td>Usage statistics</td><td>Aggregate numbers only, nothing about people</td></tr>
              </tbody>
            </table>
            <h2>Statistics without cookies</h2>
            <p>We count how many people use the app each day and which features they use, on our own server, without cookies or third parties. We cannot link one visit to another, or to a person.</p>
            <h2>Your rights</h2>
            <ul>
              <li>See your data in “My account”: visits, spending, favourites.</li>
              <li>Delete your account yourself from “My account”, without writing to anyone. Ratings and feedback stay, no longer linked to you.</li>
              <li>For anything else, write to the contact address above.</li>
            </ul>
            <h2>Allergens and food information</h2>
            <p>Allergens and dietary tags come from the canteen, which remains their source. When they are missing, the app says “Information not available”, never “does not contain”.</p>
          </>
        )}
        <div className="ub-nav-space" />
      </main>
    </div>
  );
}
