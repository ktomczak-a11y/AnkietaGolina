# Nasz Prąd — wewnętrzny system zakupowy

Kompletna aplikacja operacyjna do obsługi zapotrzebowań od utworzenia, przez akceptację i zakup, aż po dostawę, weryfikację i zamknięcie. Dane są trwale przechowywane w relacyjnej bazie SQLite; API egzekwuje role i uprawnienia niezależnie od interfejsu.

## Uruchomienie

```bash
npm install
npm run dev
```

Interfejs: `http://localhost:5173` (Vite przekazuje API do portu 3000). Wersja produkcyjna:

```bash
npm run build
JWT_SECRET='długi-losowy-sekret' npm start
```

## Konta demonstracyjne

Wspólne hasło początkowe: `NaszPrad!2026`.

| Login | Rola |
|---|---|
| `admin` | Administrator |
| `dyrektor` | Dyrektor |
| `koordynator` | Koordynator |
| `techniczny` | Dział techniczny |
| `zakupowiec` | Zakupowiec |

## Architektura i bezpieczeństwo

- React + TypeScript + Vite: responsywny interfejs operacyjny.
- Express + SQLite: REST API, trwała relacyjna baza, transakcje i klucze obce.
- JWT w ciasteczku `HttpOnly`, `SameSite=Strict`, limit 8 godzin; produkcyjnie również `Secure`.
- bcrypt (12 rund), brak publicznej rejestracji, blokada kont i zmiana/reset hasła.
- Elastyczne RBAC (`roles.permissions` oraz uprawnienia dodatkowe użytkownika), kontrolowane na endpointach.
- Audit log decyzji, statusów, wyboru ofert, dostaw i operacji administracyjnych.
- Upload ograniczony do 10 MB i do typów dokumentów/obrazów.

Baza i dane demonstracyjne inicjalizują się idempotentnie przy pierwszym starcie w `data/app.db`. Do wdrożenia wieloinstancyjnego model można przenieść do PostgreSQL, zachowując warstwę API i relacyjny schemat.

## Główny workflow

`DRAFT → PENDING_APPROVAL → APPROVED → BUYER_NEW → SEARCHING_OFFERS → COMPARING → TO_ORDER → ORDERED → IN_DELIVERY → DELIVERED → VERIFIED → CLOSED`

Obsługiwane są również: zwrot do poprawy, odrzucenie oraz anulowanie. Przed akceptacją API oblicza zajętość budżetu i blokuje przekroczenie bez `budget:override`.
