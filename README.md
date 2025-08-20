<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/logo-dark.svg">
    <img src="public/logo-light.svg" alt="TaskFlow Logo" width="250">
  </picture>
</p>
<h1 align="center">TaskFlow 🌊 — Twoje Nowoczesne Centrum Produktywności</h1>

Witaj w **TaskFlow** — zaawansowanej i intuicyjnej aplikacji do zarządzania zadaniami, zaprojektowanej, by pomóc Ci zorganizować pracę, skupić się na celach i zwiększyć produktywność. TaskFlow dostosowuje się do Twojego stylu pracy, oferując elastyczne widoki dla list zadań i projektów.

---

## ✨ Kluczowe Funkcje

- **Elastyczne Zarządzanie Zadaniami:** Dodawaj, edytuj, usuwaj i oznaczaj zadania jako ukończone. Zmieniaj ich kolejność z łatwością dzięki funkcji "przeciągnij i upuść".
- **Dwa Tryby Pracy:** Wybieraj między prostym widokiem zorientowanym na **Listy** lub kompleksowym trybem **Projektów** z tablicą Kanban, kalendarzem i osią czasu.
- **Zaawansowane Listy:** Organizuj zadania w dedykowanych listach.
    - **🌐 Publiczne:** Dostępne dla każdego, idealne do współpracy.
    - **🔒 Prywatne:** Chronione hasłem, aby zabezpieczyć poufne informacje.
    - **👤 Osobiste:** Widoczne tylko dla Ciebie, gdy jesteś zalogowany.
- **Inteligentne Presety (Tryb Skupienia):** Twórz zestawy cyklicznych zadań (np. "Poranna Rutyna") i aktywuj je, aby skupić się tylko na tym, co w danym momencie jest najważniejsze.
- **Organizacja z Tagami:** Kategoryzuj zadania za pomocą kolorowych tagów dla łatwiejszego filtrowania i odnajdywania.
- **Konta Użytkowników:** Zarejestruj się, aby synchronizować swoje zadania i ustawienia na wszystkich urządzeniach.
- **Pełna Personalizacja:** Dostosuj wygląd aplikacji dzięki motywom jasnym/ciemnym oraz szerokiej gamie palet kolorystycznych.
- **Responsywny Design:** Korzystaj z TaskFlow wygodnie na komputerze, tablecie i telefonie.
- **Notatki:** Twórz i przechowuj proste notatki w formacie Markdown.

---

## 🎨 Zrzuty Ekranu

<p align="center">
  <img src="https://placehold.co/800x450.png" alt="Główny widok aplikacji" width="80%" data-ai-hint="application screenshot" />
  <br/>
  <em>Główny widok aplikacji TaskFlow.</em>
</p>

---

## 🚀 Instalacja i Uruchomienie

Aby uruchomić projekt lokalnie, postępuj zgodnie z poniższymi krokami.

### 1. Wymagania
-   **Node.js**: wersja 18.17 lub nowsza
-   **npm** (lub inny menedżer pakietów, np. yarn, pnpm)
-   **Git**

### 2. Sklonuj Repozytorium
Otwórz terminal i sklonuj repozytorium na swój komputer:
```bash
git clone https://github.com/Gabriel-L-01/TaskFlow.git
cd TaskFlow
```

### 3. Zainstaluj Zależności
Zainstaluj wszystkie niezbędne pakiety:
```bash
npm install
```

### 4. Konfiguracja Bazy Danych
Aplikacja korzysta z bazy danych PostgreSQL. Możesz użyć usług takich jak [Neon](https://neon.tech), [Supabase](https://supabase.com) lub lokalnej instancji.

### 5. Skonfiguruj Zmienne Środowiskowe
W głównym folderze projektu utwórz plik `.env` i wklej do niego swój adres URL połączenia z bazą danych:
```.env
DATABASE_URL="postgres://user:password@host/dbname?sslmode=require"
```
*Uwaga: W przypadku Neon i Supabase upewnij się, że URL kończy się na `?sslmode=require`.*

### 6. Synchronizuj Schemat Bazy Danych
Uruchom komendę, aby automatycznie utworzyć wszystkie niezbędne tabele w Twojej bazie danych:
```bash
npm run db:push
```

### 7. Uruchom Aplikację
Teraz możesz uruchomić serwer deweloperski:
```bash
npm run dev
```
Aplikacja będzie dostępna pod adresem `http://localhost:3000`.

---

## 🔧 Technologie

TaskFlow jest zbudowany z wykorzystaniem nowoczesnego stosu technologicznego, w tym:

-   **Framework:** Next.js 14 (App Router)
-   **Język:** TypeScript
-   **UI:** React, Tailwind CSS, ShadCN UI
-   **Baza Danych:** PostgreSQL
-   **ORM:** Drizzle ORM
-   **Przeciągnij i Upuść:** @hello-pangea/dnd
-   **Sztuczna Inteligencja:** Genkit

---

## 📢 Otwarty Kod Źródłowy
TaskFlow to projekt open-source. Czujesz, że możesz coś ulepszyć? Masz pomysł na nową funkcję? Dołącz do nas i pomóż rozwijać aplikację! Kod źródłowy jest dostępny na GitHubie: [Gabriel-L-01/TaskFlow](https://github.com/Gabriel-L-01/TaskFlow).
