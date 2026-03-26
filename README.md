# Book Covers Site

Сайт-портфолио обложек книг на `Astro` с приоритетом на статику и короткие motion loops.

## Текущий курс проекта

- production-подача: `static imagery + webm/mp4`
- runtime viewer-слой исключён из текущей архитектуры
- основной фокус: сильные постеры, detail-изображения и короткие premium motion loops

## Что уже реализовано

- маршруты: `/`, `/cases/essentialism`, `404`
- ingestion pipeline для ассетов
- деплой в GitHub Pages через GitHub Actions
- база для дальнейшего переноса дизайна в чистый Astro-каркас

## Локальный запуск

```bash
npm ci
npm run assets:synthesize-spread
npm run assets:ingest
npm run dev
```

Сервер по умолчанию: `http://localhost:4321`.

## Полезные команды

```bash
npm run assets:synthesize-spread
npm run assets:ingest
npm run build
npm run astro -- check
```

## Как устроены ассеты

Источник первой книги:

- `../covers/projects/Essentialism/01/front.png`
- `../covers/projects/Essentialism/01/back.png`
- `../covers/projects/Essentialism/01/spine.png`
- `../covers/projects/Essentialism/01/spread.png`

Runtime-ассеты после ingestion:

- `public/assets/books/essentialism/*.webp`
- `public/assets/cases/essentialism/*.webp`

Целевой слой ассетов для презентации:

- `public/assets/motion/<slug>/*.webm`
- `public/assets/motion/<slug>/*.mp4`
- `public/assets/motion/<slug>/*-poster.webp`

## GitHub Pages

CI workflow: `./.github/workflows/deploy-site.yml`

- пуш в `main` запускает build + deploy
- `base` вычисляется автоматически по имени репозитория в CI
- локально `base` остаётся `/`

Подробный гайд: `docs/site-deploy-github-pages.md`.
