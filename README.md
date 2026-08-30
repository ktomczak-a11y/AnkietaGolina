# Ankieta Golina – Wizja Lokalna PV
# Ankieta Golina

Prywatna aplikacja terenowa Nasz Prąd S.A. do wykonywania audytów instalacji OZE.

## Tryb offline

- wszystkie odpowiedzi, zdjęcia, szkice i podpisy są zapisywane lokalnie w IndexedDB;
- po wybraniu „Zakończ i wyślij audyt” bez Internetu audyt trafia do kolejki;
- po ponownym połączeniu wysyłka do Google Sheets/Drive oraz generowanie PDF wznawiają się automatycznie;
- kolejny audyt można rozpocząć dopiero po potwierdzeniu kompletnej synchronizacji.

## Android

Projekt Android Studio znajduje się w katalogu `android`. Gotowy instalowalny plik jest budowany przez prywatny workflow GitHub Actions jako artefakt `AnkietaGolina-private-apk`.
Instalowalna aplikacja PWA do przeprowadzania wizji lokalnych PV i magazynów energii.

Funkcje:
- formularz techniczny,
- zdjęcia i podpisy,
- wybór wycinka mapy satelitarnej lub zdjęcia,
- szkicowanie modułów PV, tras AC/DC i urządzeń,
- lokalny zapis offline,
- generowanie PDF,
- wybór Beneficjenta i pobieranie przydzielonych urządzeń z zakładki `REALIZACJA - AKTUALIZOWANA`,
- automatyczny zapis roboczy do zakładki `ODPOWIEDZI`,
- generowanie PDF, zapis dokumentacji na Dysku Google i wysyłka e-mail,
- gotowe połączenie z wdrożoną usługą Google Apps Script — bez konfiguracji na urządzeniu.

Aplikacja działa bez logowania użytkownika. Dostęp do danych realizuje wdrożenie Apps Script uruchamiane na koncie właściciela arkusza.
