# Исследование: как добиться по-настоящему фотореалистичного 3D-view книги

Дата: 2026-03-22

## Цель

Добиться не просто «приятного 3D», а портфолио-уровня визуального качества, где книга выглядит как реальный физический объект, а не как аккуратная WebGL-иллюстрация.

## Короткий вывод

Если цель именно фотореализм, текущую архитектуру viewer нужно не просто слегка тюнить, а менять на другом уровне.

Главная проблема не в `three.js` как библиотеке. Проблема в том, что текущая реализация строит книгу как набор из нескольких плоскостей и простого блока страниц, а затем освещает это базовым real-time светом. Такой подход может дать clean product visualization, но не настоящий предметный реализм.

Мой вывод:

- `Three.js + React Three Fiber` оставляем как основную платформу, если нам нужен максимальный контроль над эстетикой, камерой, светом, материалами, качественными режимами и дальнейшим ростом.
- Но текущий procedural viewer на 5 сегментах нужно заменить на pipeline с полноценной 3D-моделью книги в `glTF/GLB`, авторскими PBR-материалами и HDRI/IBL-светом.
- Для «вау-уровня» в портфолио лучше использовать гибрид: realtime viewer для интерактива + отдельные офлайн/near-offline hero-рендеры для превью и кейс-постеров.
- `<model-viewer>` хорош как быстрый и качественный baseline для GLB-модели, но для нашей задачи он слишком ограничен как основной арт-дирекшн-слой.
- `Spline` хорош для быстрого визуального исследования и прототипирования, но я не рекомендую строить на нём core-архитектуру портфолио, если нам важны полный контроль, переносимость и стабильный production pipeline.

## Что не так в текущей реализации

### 1. Геометрия книги слишком упрощена

Сейчас viewer фактически состоит из:

- `planeGeometry` для front/back/spine/hinge
- `boxGeometry` для блока страниц
- небольшого изгиба hinge через поворот группы

Это означает, что в сцене нет:

- реальной толщины обложки
- фасок и микроскруглений
- физически правдоподобной кромки блока страниц
- реального изгиба корешка
- микронеровностей бумаги и ламинации
- отдельных материалов для покрытия, бумаги, лака, тиснения и т.д.

Следствие: даже идеальный свет и path tracing не спасут сцену, если сам объект геометрически слишком условный.

### 2. Материалы пока ближе к «аккуратному standard shading», чем к предметному PBR

Сейчас используется `meshStandardMaterial` с roughness/metalness и цветовой текстурой spread-сегментов.

Отсутствуют:

- `MeshPhysicalMaterial` или эквивалентный физический PBR-пайплайн
- clearcoat для ламинированной обложки
- roughness map
- normal/bump map
- AO map
- вариативность микроблеска
- контролируемые specular/reflection characteristics

Для печатной обложки и бумаги это критично: ощущение «дорогого физического объекта» строится именно на микросвете и микронеровностях.

### 3. Нет image-based lighting / HDRI-окружения

Сцена сейчас освещается набором directional lights + ambient light.

Для product-grade realism этого обычно недостаточно. Фотореализм в web-3D очень сильно зависит от:

- HDRI environment
- предфильтрованного environment map
- правдоподобных отражений
- мягких световых градиентов, которые не выглядят как «три лампы в пустоте»

### 4. Нет полноценного post-processing и cinematic camera pipeline

Сейчас нет отдельного quality-chain для:

- tone mapping strategy
- color grading
- AO/SSAO
- DOF
- selective bloom/glare при необходимости
- quality-mode для still/hero render

### 5. Вся визуальная ставка делается на real-time WebGL без разделения режимов качества

Для портфолио это риск. Если интерактивный viewer должен одинаково работать и на средних устройствах, и при этом выглядеть как студийный рендер, появляется конфликт:

- либо мы режем качество ради realtime
- либо убиваем performance ради картинки

Поэтому для портфолио разумнее делать не один универсальный режим, а несколько.

## Проверка ключевой гипотезы

Ключевая гипотеза: низкое ощущение качества вызвано в первую очередь не исходными картинками, а сценой, геометрией и shading/render pipeline.

Проверил тремя независимыми способами:

1. Кодовая диагностика
- В `src/components/three/BookViewer3D.tsx` книга собирается из плоскостей и одного короба страниц.
- Используются `meshStandardMaterial`, базовый directional light setup, нет HDRI, `PMREM`, `GLTFLoader`, PBR-карт, postprocessing chain и path tracing.

2. Проверка ассетов
- Исходные размеры `front/back/spine/spread` и итоговые `webp` не были уменьшены при ingestion.
- Значит основной лимит качества не сводится к простому downscale текстур.

3. Сверка с официальной документацией стеков
- `three.js` прямо рекомендует environment map для `MeshPhysicalMaterial` и акцентирует важность color management, glTF и корректного output pipeline.
- `model-viewer` отдельно подчёркивает важность HDR environment и tone mapping как критической финальной стадии рендера.

Уверенность: 92%

## Что говорят официальные источники и как это влияет на решение

### Three.js

Что важно:

- `three.js` рекомендует `glTF` как основной runtime-формат для 3D-моделей.
- В manual по color management сказано, что современные rendering workflows требуют линейного рабочего пространства, корректной разметки color textures и корректного output color space.
- `PMREMGenerator` нужен для корректного image-based lighting; для equirectangular input three.js отдельно описывает workflow через PMREM.
- `MeshPhysicalMaterial` даёт более продвинутый PBR, но для лучших результатов требует environment map.
- Официальный пример `webgl_renderer_pathtracer` показывает, что high fidelity path tracing в экосистеме three.js достижим, хотя это уже heavier route и не «обычный дефолтный realtime viewer».
- `NeutralToneMapping` уже есть в three.js constants, что важно для более точной передачи цвета, если мы хотим продуктовую честность, а не только cinematic look.

Практический вывод:

`three.js` подходит для нашей цели, но только если мы сменим не косметику, а сам pipeline: модель, материалы, окружение, color pipeline, light setup и quality modes.

### React Three Fiber / Drei

Что важно:

- R3F не мешает качеству как таковому; это orchestration layer, а не ограничение по рендеру.
- В docs R3F есть рекомендации по `frameloop="demand"`, adaptive quality, performance regression и progressive loading.
- Drei даёт готовые блоки, которые нам особенно полезны для migration:
  - `Environment`
  - `Stage`
  - `AccumulativeShadows` / contact shadows
  - `Lightformer`
  - `useEnvironment`

Практический вывод:

R3F можно и нужно оставить. Ограничение не в нём, а в том, что мы пока используем его на слишком простом уровне.

### <model-viewer>

Что важно:

- `model-viewer` даёт очень сильный baseline для показа GLB-моделей на вебе и хорошо работает как product viewer.
- В официальных примерах отдельно подчёркнута важность HDR environment и tone mapping.
- Документация показывает, что scene graph API есть, но exposed scope специально ограничен: наружу даются в основном materials и их дети, а не весь scene graph.
- Есть `model-viewer-effects`, где доступны postprocessing и quality/performance режимы.
- У компонента сильная browser support story и удобный путь для AR.

Практический вывод:

`<model-viewer>` сильно лучше текущего viewer, если у нас уже есть качественный `GLB`. Но он хуже `R3F`, если нам нужен авторский визуальный язык, нестандартная композиция сцены, тонкая кастомная режиссура света, свой render pipeline и контроль над переходом к более тяжёлым режимам качества.

### Spline

Что важно:

- В документации Spline есть реалистичные material workflows: `Physical` lighting layer, roughness/bump maps, material layers, soft shadows, DoF, post-processing и т.д.
- Это делает его очень сильным инструментом для визуального exploration/prototyping.
- Но у Spline есть принципиальный production-минус для нашей задачи: при экспорте `GLTF/GLB` официально не сохраняются environment, lighting, fog, post-processing, animation, physics, states/events и многие material layers.
- То есть часть визуальной магии остаётся внутри runtime Spline, а не переносится как portable asset pipeline.

Практический вывод:

Spline хорош как:

- инструмент предпродакшна
- быстрый способ найти композицию, свет и настроение
- возможно, как отдельный hero-эксперимент

Но Spline плох как основной фундамент, если нам нужен устойчивый, переносимый и инженерно-контролируемый pipeline фотореалистичного product viewer.

## Сравнение вариантов

### Вариант A. Оставить текущий viewer и просто «дотюнить» свет/материалы

Плюсы:

- минимальные изменения
- быстро
- низкий риск по интеграции

Минусы:

- не даст настоящего фотореализма
- упирается в упрощённую геометрию
- останется ощущение «web object», а не «предметной съёмки»

Вердикт:

Не рекомендую, если цель действительно принципиальна.

### Вариант B. Оставить Three.js/R3F, но полностью заменить 3D-asset pipeline

Суть:

- вместо procedural 5-plane book использовать полноценную `GLB`-модель книги
- готовить её в Blender/C4D
- использовать PBR-материалы, HDRI, корректный tone mapping и quality modes

Плюсы:

- лучший баланс между контролем, качеством и future-proof архитектурой
- можно довести до очень высокого визуального уровня
- остаётся свобода по взаимодействиям, камере, композиции, брендингу

Минусы:

- дороже по производству
- нужен asset pipeline и 3D-authoring
- сложнее, чем `<model-viewer>`

Вердикт:

Это мой основной recommendation.

### Вариант C. Полная замена viewer на <model-viewer>

Суть:

- делаем качественный `GLB`
- отдаём его через `<model-viewer>`
- используем HDRI, shadows, exposure, tone mapping, при необходимости `model-viewer-effects`

Плюсы:

- быстрее, чем строить advanced custom pipeline
- качественный baseline уже из коробки
- отлично подходит для product display
- хороший fallback и AR-ready story

Минусы:

- меньше контроля над сценой
- меньше свободы для bespoke visual direction
- сложнее реализовать truly custom portfolio presentation

Вердикт:

Хороший вариант, если приоритет — быстро получить заметно более дорогую картинку без тяжёлой кастомной инженерии. Но как long-term core solution я бы ставил его ниже, чем кастомный `R3F` pipeline.

### Вариант D. Уйти в Spline

Плюсы:

- очень быстро можно искать красивую сцену
- удобно для арт-дирекшна и интерактивных презентаций
- низкий порог для сценического прототипа

Минусы:

- слабее переносимость production-пайплайна
- часть качества живёт внутри Spline runtime, а не в portable asset
- меньше контроля и предсказуемости в долгую
- экспорт в `GLB` теряет важные визуальные вещи

Вердикт:

Хорошо как инструмент исследования и mood/prototype. Не рекомендую как основу основной архитектуры портфолио.

## Рекомендуемая архитектура

### Рекомендация: гибридный photoreal pipeline

#### 1. Asset authoring layer

Создаём master-модель книги в `Blender`:

- реальная толщина переплёта
- лёгкие фаски на всех читаемых рёбрах
- отдельный page block
- отдельный материал бумаги
- отдельный материал покрытия обложки
- опционально: слой лака/spot UV/foil как отдельные material zones
- чуть-чуть физической неровности, чтобы не было CAD-стерильности

Формат выхода:

- `book.glb`
- PBR texture set
- по возможности `KTX2` для runtime-текстур

Важно: текущий spread workflow можно сохранить как источник печатной графики, но он должен стать частью texture authoring, а не заменой полноценной модели.

#### 2. Runtime layer на Three.js + R3F

Новая сцена:

- загрузка книги через `GLTFLoader` / `useGLTF`
- HDRI environment через `Environment` или свой HDR pipeline
- `PMREM` / IBL workflow
- `MeshPhysicalMaterial` либо корректно экспортированные glTF PBR-материалы
- отдельные материалы для:
  - cover laminate
  - page block
  - optional foil/varnish
- мягкие studio shadows
- корректный color management
- контролируемый tone mapping

#### 3. Два режима качества

`interactive`

- realtime
- adaptive DPR
- ограниченный post-processing
- стабильный FPS

`hero`

- выше DPR
- accumulative/soft shadows
- AO/SSAO
- DOF
- более дорогой post-processing
- включается на desktop/idle/on-demand

#### 4. Отдельный слой портфолио-рендеров

Для карточек кейсов и hero-первого экрана я рекомендую не полагаться только на realtime canvas.

Лучше иметь:

- один или несколько офлайн-render stills
- возможно короткий loop/video
- realtime viewer уже как доказательство интерактивности

Это резко снижает риск, что первый экран будет выглядеть «почти круто, но не совсем».

## Что конкретно стоит изменить в проекте

### Минимум, если идём в серьёзный upgrade без полной смены стека

1. Убрать зависимость от procedural 5-plane geometry как основного способа показа книги.
2. Ввести `GLB`-ассет книги как новый первичный источник геометрии.
3. Перейти на полноценные PBR-материалы.
4. Добавить HDRI environment и calibrated studio lighting.
5. Ввести quality modes: `realtime` / `hero`.
6. Добавить post-processing chain.
7. Пересмотреть tone mapping под задачу портфолио.

### Tone mapping strategy

Для обложек важны и цветовая честность, и эстетика.

Я бы рекомендовал такой порядок теста:

1. `NeutralToneMapping` как базовый режим для проверки честности цветов.
2. `AgX` как artistic-alternative, если нужен более киношный rolloff.
3. `ACES` только если после референс-сравнения он действительно выглядит лучше, потому что даже официальная документация `model-viewer` отдельно предупреждает о hue shift и сильной desaturation у ACES.

### Post-processing strategy

Очень умеренно:

- AO/SSAO: да
- DOF: да, но только в hero/still режимах и очень деликатно
- Bloom: минимально или нет
- Color grading: да
- Sharpen/clarity: осторожно

Для книги важнее «дорогой студийный свет», чем спецэффекты.

### Material strategy для книги

Cover:

- base color map
- roughness map
- subtle normal/bump
- clearcoat
- clearcoat roughness

Pages:

- slightly warm/off-white albedo
- roughness variation
- micro normal or bump
- edge shading/AO

Special finishes, если нужны:

- foil as separate material zone
- spot UV via mask-driven clearcoat/specular response

## Где path tracing действительно уместен

Path tracing имеет смысл, если:

- нужен режим «inspect / hero render»
- мы делаем промо-кадры внутри браузера
- устройство достаточно мощное
- прогрессивное накопление кадра допустимо

Path tracing не решает базовую проблему, если:

- модель слишком условная
- материалы бедные
- свет не поставлен

То есть path tracing — не волшебная кнопка, а финальный quality multiplier поверх уже сильной сцены.

## Мой финальный recommendation

Если цель сформулирована как «по-настоящему фотореалистичный 3D-view для портфолио, где любая мелочь имеет значение», я рекомендую следующее:

### Основной путь

- не менять `three.js/R3F` на другой runtime
- но заменить текущую 3D-архитектуру viewer почти полностью
- перейти на `GLB + PBR + HDRI + calibrated studio lighting + quality modes`
- вынести hero-first impression в отдельные offscreen/offline рендеры для карточек и кейсов

### Что я не рекомендую

- не пытаться «выжать фотореализм» из текущего 5-plane procedural viewer
- не делать ставку только на runtime-realism без hero stills
- не уходить в Spline как в основной production foundation

### Когда я бы выбрал <model-viewer>

Я бы рассматривал `<model-viewer>` только если нам нужен более быстрый и менее кастомный путь:

- качественный GLB уже есть
- интерактив умеренный
- кастомная режиссура сцены вторична
- хочется быстро получить заметно более дорогий baseline

## Предлагаемый migration plan

### Phase 1. Asset pipeline

- подготовить master book model в Blender
- завести экспорт `GLB`
- подготовить PBR texture set
- собрать 1 HDRI studio environment

### Phase 2. Новый viewer

- создать новый компонент рядом со старым, без немедленного удаления текущего
- загрузка через `useGLTF`
- environment + PMREM/IBL
- camera presets
- quality modes

### Phase 3. Hero visuals

- подготовить poster/still renders для home/case cards
- realtime viewer оставить для интерактивного слоя

### Phase 4. Cleanup

- если новый pipeline подтверждает качество, старый procedural viewer оставить только как fallback/dev mode или удалить

## Практический выбор для этого проекта

Если выбирать одну стратегию без распыления, я бы выбрал:

`Blender-authored GLB + Three.js/R3F runtime + HDRI/PBR/postprocessing + hero still renders`

Это лучший компромисс между:

- настоящим визуальным качеством
- эстетическим контролем
- инженерной устойчивостью
- масштабируемостью под новые кейсы

## Источники

- Three.js Color Management: https://threejs.org/manual/en/color-management.html
- Three.js PMREMGenerator: https://threejs.org/docs/pages/PMREMGenerator.html
- Three.js MeshPhysicalMaterial: https://threejs.org/docs/pages/MeshPhysicalMaterial.html
- Three.js Loading 3D Models: https://threejs.org/manual/en/loading-3d-models.html
- Three.js GLTFLoader: https://threejs.org/docs/pages/GLTFLoader.html
- Three.js OutputPass: https://threejs.org/docs/pages/OutputPass.html
- Three.js tone mapping constants: https://threejs.org/docs/api/en/constants/Renderer.html
- Three.js path tracing example: https://threejs.org/examples/webgl_renderer_pathtracer.html
- React Three Fiber Scaling Performance: https://r3f.docs.pmnd.rs/advanced/scaling-performance
- Drei Stage: https://drei.docs.pmnd.rs/staging/stage
- Drei Environment: https://drei.docs.pmnd.rs/staging/environment
- <model-viewer> overview: https://modelviewer.dev/
- <model-viewer> Lighting & Environment: https://modelviewer.dev/examples/lightingandenv/
- <model-viewer> Materials & Scene Examples: https://modelviewer.dev/examples/scenegraph/index.html
- <model-viewer> PostProcessing Examples: https://modelviewer.dev/examples/postprocessing/index.html
- Spline Lighting Layer: https://docs.spline.design/materials-shading/lighting-layer
- Spline Bump Map & Roughness Map: https://docs.spline.design/materials-shading/bump-map-roughness-map
- Spline Soft Shadows: https://docs.spline.design/lighting/soft-shadows
- Spline Creating Material Layers: https://docs.spline.design/materials-shading/creating-material-layers
- Spline Exporting as Self-Hosted Project: https://docs.spline.design/exporting-your-scene/web/exporting-as-self-hosted-project
- Spline Code API for Web: https://docs.spline.design/exporting-your-scene/web/code-api-for-web
- Spline Exporting as GLTF/GLB: https://docs.spline.design/exporting-your-scene/files/exporting-as-gtlf-glb
