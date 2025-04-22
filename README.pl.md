<table>
<tr>
<td>
<img src="public/images/logo.png" alt="Logo" width="150"/>
</td>
<td>
<h2>ProjectPromptLLM</h1>
</td>
</tr>
</table>

![npm](https://img.shields.io/npm/v/ppllm) ![npm downloads](https://img.shields.io/npm/dm/ppllm) ![license](https://img.shields.io/npm/l/ppllm)

Twój asystent do generowania promptów na bazie struktury projektu! 🚀  
Prosty, wygodny, konfigurowalny — wystarczy jednowyrazowe polecenie, by wygenerować czytelny prompt z drzewem plików i zawartością Twojego projektu.

<table>
<tr>
<td>
<img src="public/images/usage.gif" alt="usage-gif" />
</td>
</tr>
</table>

Aby gotowy prompt wylądował w pliku w miejscu, gdzie jesteś, po prostu odpal:
```bash
ppllm
```

Wynikowy prompt w domyślnym pliku `ppllm.prompt.txt` będzie wyglądał w ten sposób:<br />
<table>
<tr>
<td>
<img src="public/images/result-example.png" alt="result-example" width="277" />
</td>
</tr>
</table>


## 🌟 Czym jest PPLLM?

**ProjectPromptLLM** (`ppllm`) to narzędzie CLI, które tworzy prompt na podstawie struktury i zawartości plików projektu. Prompt ten następnie można użyć z ChatGPT lub innym LLM w celach badawczych lub rozwojowych. Obsługuje presety ignorowanych plików i folderów, rozbudowaną konfigurację oraz własne szablony.

## 💾 Instalacja

Zalecana instalacja z flagą `-g` w celu globalnego dostępu do komendy `ppllm` bez konieczności używania `npx`
```bash
npm install -g ppllm
```
lub
```bash
npm install ppllm
```

## 🚀 Podstawowe użycie

Najprostsze użycie:
```bash
ppllm
```
Po wykonaniu tej komendy skanowany jest obecny katalog, a następnie gotowy prompt zapisuje się do pliku (domyślnie `ppllm.prompt.txt`)

Może się okazać że w prompcie umieszczone zostały pliki, które nie miały się tam znaleźć, np. z `node_modules` których może być bardzo dużo, przez co wynikowy wielki prompt będzie niepraktyczny. By temu zapobiec użyj (tylko raz) komendy:

```bash
ppllm -p nodejs
```

W ten sposób wskażesz `ppllm` aby użył wbudowanego presetu z listą ignorowanych ścieżek charakterystycznych dla projektu `node.js`. Skrypt również zapisze od razu te decyzje do pliku konfiguracyjnego (domyślnie `ppllm.config.json`) w obecnej lokalizacji, dzięki czemu od następnej komendy możesz już spowrotem używać krótkiej komendy `ppllm` bez dodatkowych parametrów.

## 🧠 Rozszerzone użycie

Interaktywny kreator konfiguracji:
```bash
ppllm init
```

Lista dostępnych presetów lub zawartość wybranego:
```bash
ppllm preset
ppllm preset python
```

Sklonowanie do obecnej lokalizacji domyślnego angielskiego szablonu do generowania promptu (`handlebars`) i ustawienie jego nazwy w nazwie pliku [nazwa].prompt.hbs (`custom` jeśli pominięte):
```bash
ppllm template
ppllm template nazwa
```

Obecna wersja Twojego ppllm:
```bash
ppllm version
```

Pomoc:
```bash
ppllm --help
ppllm preset --help
ppllm generate --help
```

## 🛠️ Konfiguracja

Ustawienia możesz zapisać w lokalnym pliku (domyślnie: `ppllm.config.json`).

CLI zapisuje je automatycznie po użyciu interaktywnego kreatora (`ppllm init`) lub przy podaniu opcji podczas generowania promptu, np.: `ppllm -p nodejs -b all`
W pliku konfiguracyjnym znajdziesz też miejsce na Twoją własną listę ignorowanych plików i folderów `"ignore"` (użyj formatu `glob`), która oczywiście łączy się z wybranym presetem.

Przykładowa zawartość pliku konfiguracyjnego:

```json
{
  "settings": {
    "template": "pl",
    "file": "ppllm.prompt.txt",
    "preset": ["general", "nodejs"],
    "maxSize": "10KB",
    "binary": "tree",
    "emoji": true
  },
  "ignore": [
    "TODO"
  ]
}
```

## 🧩 Template'y

Prompt jest generowany na podstawie szablonu Handlebars (`.hbs`). Domyślnie używany jest wbudowany szablon angielski `eng`, ale dostępne są też inne wbudowane szablony. Możliwe jest również wskazanie swojego własnego szablonu poprzez podanie jego pełnej nazwy pliku.

Aby użyc własny szablon, najpierw sklonuj domyślny wbudowany szablon angielski:

```bash
ppllm template custom
```

A następnie wskaż jego użycie w konfiguracji lub przez CLI:

```bash
ppllm -t custom.prompt.hbs
```

Natomiast aby wrócić do jednego z domyślnych, uruchom jedno z komend poniżej:

```bash
ppllm -t eng
ppllm -t pl
```

## 🗂️ Presety

Presety to gotowe listy plików i folderów, które mają być pomijane podczas generowania promptu.  
Projekt posiada wbudowane presety jeden generalny oraz dla popularnych technologii:

- `general`
- `nodejs`
- `python`

Presety **nie są rozszerzalne przez użytkownika**, ale można dodać własne reguły ignorowania w pliku konfiguracyjnym.

## 📝 Zaawansowane możliwości

- Obsługa plików binarnych w trzech trybach: `tree`, `all`, `none`
- Ograniczenie rozmiaru plików (`--max-size`) do ładowania zawartości
- Opcjonalne emoji w promptach 🎉

## 🎯 Przykłady użycia

Generowanie promptu z użyciem presetu `nodejs` i emoji:

```bash
ppllm -p nodejs -e
```

Użycie własnego szablonu:

```bash
ppllm -t myTemplate.prompt.hbs
```

Eksport do pliku o niestandardowej nazwie:

```bash
ppllm -f magic.prompt.txt
```

## ⚙️ Opcje CLI (które zapisują się do konfiguracji)

| Flaga                          | Opis                                        | Domyślna wartość |
| ----------------------------- | ------------------------------------------- | ---------------- |
| `-d, --dir <dir>`              | Katalog źródłowy projektu                   | `.`              |
| `-t, --template <template>`    | Szablon Handlebars do generowania promptu   | `eng`            |
| `-f, --file <filename>`        | Nazwa pliku wynikowego                     | `ppllm.prompt.txt` |
| `-p, --preset <preset...>`     | Preset(y) ignorowanych plików/folderów      | []               |
| `-m, --max-size <size>`        | Maksymalny rozmiar pliku (np. 10MB, 5KB)    | `disable`        |
| `-b, --binary <mode>`          | Tryb obsługi binarek (`tree`, `all`, `none`) | `tree`           |
| `-e, --emoji`                  | Czy dodawać emoji do promptów               | `false`          |


## 🧭 Pozostałe opcje CLI

| Flaga                          | Opis                                        | Domyślna wartość |
| ----------------------------- | ------------------------------------------- | ---------------- |
| `-o, --output <mode>`          | Wyjście: `stdout` lub `file`                | `file`           |
| `-c, --config <filename>`      | Nazwa pliku konfiguracyjnego                | `ppllm.config.json` |

## ⚖️ Licencja

ISC © [tonylus](https://github.com/TonylusMark1)