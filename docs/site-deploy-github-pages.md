# Деплой сайта в GitHub Pages

Дата: 2026-03-22

Этот гайд для репозитория `portfolio/`.

## 1. Создай новый публичный репозиторий

Пример:

- `book-covers-portfolio`

Важно: репозиторий должен быть public (для бесплатного GitHub Pages).

## 2. Запушь проект

Из корня репозитория (`/Users/vladyslavhorovyy/Documents/Design/book covers/portfolio`):

```bash
git add .
git commit -m "feat(site): bootstrap portfolio infrastructure"
git branch -M main
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

## 3. Включи GitHub Pages

В GitHub репозитории:

1. `Settings`
2. `Pages`
3. `Source`: `GitHub Actions`

Дальше workflow `/.github/workflows/deploy-site.yml` будет деплоить автоматически на каждый push в `main`.

## 4. URL сайта

Для project pages URL будет вида:

- `https://<username>.github.io/<repo>/`

`astro.config.mjs` уже настроен так, что в CI `base` берётся автоматически из `GITHUB_REPOSITORY`.

## 5. Локальная проверка перед пушем

```bash
npm ci
npm run build
npm run astro -- check
```

## 6. Замена временного spread

Сейчас `../covers/projects/Essentialism/01/spread.png` может быть временно синтезирован из panel PNG.

Когда будет готов точный spread-экспорт из Figma:

1. замени `../covers/projects/Essentialism/01/spread.png`
2. выполни:

```bash
npm run assets:ingest
npm run build
```

## Troubleshooting

- Ошибка `Missing spread.png`:
  - добавь `../covers/projects/Essentialism/01/spread.png` размером `3425x2598`
- Ошибка размеров layout:
  - проверь соответствие `back=1590`, `hingeLeft=34`, `spine=177`, `hingeRight=34`, `front=1590`, `total=3425`
- Если workflow не деплоит:
  - проверь `Settings -> Pages -> Source = GitHub Actions`
