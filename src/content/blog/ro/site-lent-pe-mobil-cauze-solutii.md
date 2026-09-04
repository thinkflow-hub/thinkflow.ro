---
title: "De ce se încarcă greu site-ul tău pe mobil — și ce poți repara singur"
description: "Cauzele reale pentru care un site de firmă se încarcă greu pe telefon, cum îți măsori corect viteza cu Google PageSpeed și ce reparații poți face singur înainte să plătești pe cineva."
date: "2026-09-04"
category: "Web Development"
tags: [wordpress, pagespeed, performanta, mobil, web-development]
affiliatePrograms: []
image: "/api/og?title=Site+lent+pe+mobil&category=Web+Development&tags=pagespeed,performanta"
verification: "market-analysis"
---

# De ce se încarcă greu site-ul tău pe mobil — și ce poți repara singur

Site-ul tău se deschide repede pe laptopul tău, pe wifi-ul de la birou, din cache-ul unui browser care l-a mai văzut de o mie de ori. Clientul tău îl deschide pe un telefon de acum patru ani, pe 4G slab, în picioare, cu degetul pe butonul de înapoi. Voi doi nu vizitați același site.

Asta e prima capcană: **senzația proprie nu e o măsurătoare.** A doua capcană e la fel de răspândită: viteza nu e o problemă estetică. Un vizitator care așteaptă prea mult nu se enervează — pleacă. Iar tu nu afli niciodată, pentru că nu apare în nicio statistică pe care o citești.

## Măsoară întâi. Durează un minut și e gratuit.

Intră pe [PageSpeed Insights](https://pagespeed.web.dev/), pune adresa site-ului tău și uită-te la scorul de **mobil**, nu la cel de desktop, care e aproape întotdeauna măgulitor. Google îți dă un scor din 100 și, mai important, îți spune ce anume trage în jos.

Ca reper cinstit din practica noastră: sub 50 înseamnă că pierzi vizitatori măsurabil; 50-75 e zona „merge, dar lasă bani pe masă"; peste 85 e treabă bună. Și ca dovadă că nici noi nu predicăm din turn: propriul nostru site a stat la 70 până de curând, din cauza unei animații care ținea titlul paginii invizibil până se încărca tot JavaScript-ul. L-am reparat abia după ce l-am măsurat. Exact lecția din acest articol.

## Vinovații obișnuiți, în ordinea frecvenței

**Imaginile nedimensionate.** Cineva a urcat fotografia direct din telefon, 4.000 de pixeli lățime și 6 MB, iar site-ul o afișează într-o casetă de 400 de pixeli. Telefonul clientului descarcă tot muntele ca să arate o pietricică. E cauza numărul unu, de departe, și cea mai ușor de reparat.

**Plugin-urile strânse în ani.** Fiecare „hai să încercăm și plugin-ul ăsta" a lăsat în urmă scripturi care se încarcă pe fiecare pagină, indiferent dacă fac ceva sau nu. Am văzut site-uri de prezentare cu 40+ de plugin-uri active, din care jumătate nu mai făceau nimic de ani buni.

**Scripturile terților.** Chat-ul pe care nu-l mai folosește nimeni, pixelii de tracking puși „temporar" în 2023, harta încorporată care încarcă o jumătate de megabyte înainte ca cineva să dea scroll până la ea. Fiecare pare mic; împreună sunt de multe ori mai grele decât site-ul însuși.

**Hostingul de 10 lei.** La trafic mic pare că merge. Doar că serverul răspunde greu la prima cerere — iar prima cerere e exact momentul în care vizitatorul decide dacă rămâne.

**Lipsa oricărui cache.** Fără cache, WordPress reconstruiește fiecare pagină de la zero, pentru fiecare vizitator, de fiecare dată. E ca și cum ai găti separat pentru fiecare client care comandă același fel.

## Ce poți face singur, azi, fără să strici nimic

1. **Comprimă imaginile.** Un plugin ca Smush sau ShortPixel (au variante gratuite) trece prin biblioteca media și face singur treaba. Pentru imaginile viitoare: redimensionează înainte de upload.
2. **Instalează un plugin de cache.** LiteSpeed Cache sau WP Super Cache, cu setările implicite, fac o diferență vizibilă în ziua unu.
3. **Fă curat în plugin-uri.** Dezactivează ce nu recunoști că folosești — pe rând, cu o zi între ele, ca să observi dacă ceva se strică. Ce rămâne dezactivat o lună fără să lipsească nimănui poate fi șters.
4. **Scoate scripturile moarte.** Chat-ul abandonat și pixelii vechi de tracking se scot din temă sau din managerul de tag-uri în câteva minute.
5. **Măsoară din nou.** Același PageSpeed, aceeași pagină. Diferența pe care o vezi e a ta, gratis.

## Când problema e mai adâncă decât atât

Dacă după toate astea scorul tot nu se mișcă, de obicei cauza e structurală: o temă grea construită pe un page builder stufos, un hosting care nu mai ține pasul sau ani de improvizații care se calcă una pe alta. Reparațiile de acolo în sus cer pe cineva care face asta zilnic — și, cinstit, cer întâi un diagnostic corect, nu un deviz din prima.

Diagnosticul ăla îl facem gratuit: [raportul de stare tehnică](https://thinkflow.ro/ro/raport-site) — ne dai adresa site-ului, primești în 24 de ore lucrătoare 3-4 constatări concrete, cu ce poți repara singur și ce ar cere intervenție. Fără instalări, fără parole, fără telefoane nesolicitate. Dacă site-ul tău e deja rapid, raportul o să ți-o spună și pe asta.
