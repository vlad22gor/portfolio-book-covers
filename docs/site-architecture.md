# Архитектура сайта портфолио обложек книг

Дата: 2026-03-27

## Короткий вывод

Сайт строим как лёгкий контентный проект с акцентом на:

- сильную статику
- короткие motion loops в `webm`
- чистую навигацию по кейсам
- минимальную техническую сложность

## Цели архитектуры

- быстро загружаться
- хорошо индексироваться
- быть простой в поддержке
- позволять добавлять новые кейсы без переписывания кода
- сохранять максимальный контроль над эстетикой презентации
- использовать `video/webm` как controlled motion layer

## Рекомендуемая структура сайта

### 1. Главная `/`

Состав:

- hero-секция с сильным изображением или постер-кадром
- опционально короткий loop в `webm`
- короткий вводный текст
- сетка карточек кейсов
- footer с контактами и навигацией

### 2. Страницы кейсов `/cases/[slug]`

Состав:

- заголовок кейса
- hero-изображение или постер motion loop
- краткая информация о проекте
- основная история кейса
- галерея деталей
- один или несколько motion blocks в `webm/mp4`

## Рекомендуемая архитектура данных

Кейсы храним локально в `src/content/cases/*.md`.

Минимальные поля кейса:

- `title`
- `slug`
- `year`
- `project`
- `shortDescription`
- `featured`
- `cover`
- `motion` (опционально)
- `gallery`
- `seo`

Пример:

```yaml
title: "The Nose"
slug: "the-nose"
year: 2026
project: "Self-initiated"
shortDescription: "Концепт книжной обложки с акцентом на ..."
featured: true
cover:
  thumb: "/assets/cases/the-nose/thumb.webp"
  poster: "/assets/cases/the-nose/poster.webp"
motion:
  poster: "/assets/motion/the-nose/hero-poster.webp"
  webm: "/assets/motion/the-nose/hero-loop.webm"
  mp4: "/assets/motion/the-nose/hero-loop.mp4"
gallery:
  - "/assets/cases/the-nose/detail-01.webp"
seo:
  title: "The Nose Book Cover"
  description: "..."
```

## Компонентный принцип

- всё, что можно отрендерить как статический HTML, остаётся в `Astro`
- motion реализуется через нативный `video`
- JS добавляем только при явной необходимости

## Пайплайн ассетов

Production-набор для кейса:

- `thumb.webp`
- `poster.webp`
- `detail-*.webp`
- `hero-poster.webp`
- `hero-loop.webm`
- `hero-loop.mp4`

## Performance-принципы

- не ставить много autoplay-видео одновременно
- для каждого видео иметь постер
- короткие loops делать компактными
- video использовать только там, где motion действительно усиливает кейс
- сетку кейсов держать статичной

## Итог

Текущая production-архитектура сайта:

- статический контентный сайт
- сильная статика как основа
- `webm/mp4` как motion-layer
- чистый путь для переноса дизайна в вёрстку
