<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/logo-dark.svg">
  <img src="public/logo-light.svg" alt="TaskFlow Logo" width="250">
  </picture>
</p>
<h1 align="center">TaskFlow 🌊 - Twoje Centrum Produktywności</h1>

Witaj w **TaskFlow** — nowoczesnej i intuicyjnej aplikacji do zarządzania zadaniami, stworzonej, by pomóc Ci zorganizować pracę, skupić się na celach i zwiększyć produktywność.

---

## 🚀 Instalacja i Uruchomienie

Aby uruchomić projekt lokalnie, postępuj zgodnie z poniższymi krokami.

### 1. Wymagania wstępne
-   **Node.js**: wersja 18.17 lub nowsza
-   **npm** (lub inny menedżer pakietów, np. yarn, pnpm)
-   **Git**

### 2. Klonowanie repozytorium
Otwórz terminal i sklonuj repozytorium na swój komputer:
```bash
git clone https://github.com/Gabriel-L-01/TaskFlow.git
cd TaskFlow
```

### 3. Instalacja zależności
Zainstaluj wszystkie potrzebne pakiety:
```bash
npm install
```

### 4. Konfiguracja bazy danych
Aplikacja korzysta z bazy danych PostgreSQL. Możesz wybrać jedną z poniższych opcji.

#### Opcja A: Neon (Rekomendowane)
1.  **Załóż konto** na [neon.tech](https://neon.tech).
2.  **Stwórz nowy projekt**.
3.  W panelu projektu, w sekcji **Connection Details**, skopiuj adres URL połączenia w formacie `postgres://...`.

#### Opcja B: Supabase
1.  **Załóż konto** na [supabase.com](https://supabase.com).
2.  **Stwórz nowy projekt**.
3.  Przejdź do `Project Settings` > `Database`.
4.  W sekcji `Connection string` skopiuj adres URL zaczynający się od `postgresql://...`.

#### Opcja C: Lokalny PostgreSQL
1.  Upewnij się, że masz zainstalowany i uruchomiony serwer PostgreSQL na swoim komputerze.
2.  Stwórz nową bazę danych, np. `taskflow_db`.
3.  Przygotuj adres URL w formacie: `postgres://TWOJ_USER:TWOJE_HASLO@localhost:5432/taskflow_db`.

### 5. Konfiguracja zmiennych środowiskowych
W głównym folderze projektu stwórz plik o nazwie `.env` i wklej do niego skopiowany lub przygotowany adres URL:

```.env
DATABASE_URL="postgres://uzytkownik:haslo@host/nazwabazy?sslmode=require"
```
*Uwaga: W przypadku lokalnej bazy danych `sslmode=require` może nie być potrzebne.*

### 6. Synchronizacja schematu bazy danych
Uruchom komendę, która automatycznie stworzy wszystkie potrzebne tabele w Twojej bazie danych na podstawie schematu zdefiniowanego w `src/lib/db/schema.ts`:
```bash
npm run db:push
```

### 7. Uruchomienie aplikacji
Teraz możesz uruchomić serwer deweloperski:
```bash
npm run dev
```
Aplikacja będzie dostępna pod adresem `http://localhost:3000`.

---

## ✅ Zarządzanie zadaniami

-   **Dodawanie zadań:** Wpisz zadanie w głównym polu i naciśnij Enter. Nowe zadania domyślnie trafiają do **Skrzynki**.
-   **Oznaczanie jako ukończone:** Kliknij checkbox obok zadania. Zostanie ono wyszarzone i przeniesione na dół listy.
-   **Edycja:** Kliknij na nazwę zadania, aby ją zmienić.
-   **Usuwanie:** Najedź na zadanie i kliknij ikonę kosza.
-   **Zmiana kolejności:** Przeciągnij zadanie w górę lub w dół, aby zmienić jego pozycję.

---

## ✨ Kluczowe funkcje

### 📋 Listy Zadań
Organizuj swoje zadania w dedykowanych listach, takich jak "Praca", "Dom" czy "Zakupy".

-   **🌐 Listy publiczne:** Dostępne dla wszystkich, idealne do współpracy zespołowej.
-   **🔒 Listy prywatne:** Zabezpieczone hasłem, aby chronić Twoje poufne informacje. Dostęp uzyskujesz po jednorazowym podaniu hasła.

### 🎯 Presety (Tryb Skupienia)
Twórz zestawy powtarzalnych zadań, takie jak "Rutyna poranna" czy "Checklista przed wyjazdem".

-   **Aktywuj tryb skupienia:** Kliknij na preset, aby wyświetlić tylko przypisane do niego zadania.
-   **Resetuj zadania:** Jeśli wykonujesz zadania cyklicznie, przycisk "Reset" pozwoli Ci szybko odznaczyć wszystkie jako nieukończone.

### 🎨 Personalizacja
Dostosuj aplikację do swojego stylu pracy.

-   **Motywy:** Wybieraj między jasnym i ciemnym motywem lub ustaw tryb automatyczny.
-   **Wsparcie dla urządzeń mobilnych:** TaskFlow jest w pełni responsywne i działa świetnie na telefonach i tabletach.

---

## 🔧 Informacje techniczne

TaskFlow został zbudowany z wykorzystaniem nowoczesnych technologii, w tym:

-   **Next.js 14** (App Router)
-   **React** i **TypeScript**
-   **Tailwind CSS** i **ShadCN** dla interfejsu użytkownika
-   **PostgreSQL** jako baza danych
-   **Drizzle ORM** do komunikacji z bazą danych

---

## 📢 Open Source
TaskFlow jest projektem open-source. Kod źródłowy znajdziesz na GitHubie: [Gabriel-L-01/TaskFlow](https://github.com/Gabriel-L-01/TaskFlow). Dołącz do nas i pomóż w rozwoju aplikacji!
