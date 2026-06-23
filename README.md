# XPopup — jQuery-плагин всплывающих окон

Гибкий, производительный и расширяемый плагин для создания попапов, модальных окон, галерей изображений и цепочек окон. Без зависимостей, кроме jQuery.

🌐 **[Документация и примеры](https://xpopup.site)**

---

## ✨ Возможности

### 🎯 Типы контента
- **Изображения** — галерея с предзагрузкой, свайпами, зумом по двойному клику, каруселью
- **AJAX** — загрузка контента через AJAX с индикацией и обработкой ошибок
- **Inline** — скрытый HTML на странице
- **Iframe** — внешние страницы, видео, карты

### 🧭 Цепочки окон и навигация
- **Несколько окон в одном боксе** — последовательное открытие
- **Кнопка «Назад»** — возврат к родительскому окну
- **Независимые боксы** — несколько параллельных боксов с разными скинами
- **Модальные цепочки** — нельзя закрыть кликом на фон
- **Программное управление** — `close()`, `back()`, `isOpen()`

### 🎨 Скины и темы
- **8 встроенных скинов**: default, vk, strong, lite, ios, material3, ya, gos
- **Автоматический тёмный режим**: `darkMode: true` для любого скина
- **Модификаторы** — гибкая настройка отступов, заголовков, фона
- **CSS-переменные** — полная кастомизация без перекомпиляции

### 🎬 Анимации
- **Web Animations API** — плавные анимации открытия/закрытия
- **Готовые эффекты**: fade, slide, zoom
- **Анимация фона** — отдельный fade для подложки

### 📱 Адаптивность и мобильные устройства
- **Резиновые размеры** — auto, strict, screen
- **Responsive-режим** — полная высота на телефонах
- **Свайпы** — жесты для галереи и закрытия
- **Адаптивная кнопка закрытия** — inside/outside/screen/auto

### 🔧 Расширяемость
- **Плагинная система** — свои типы контента и хуки
- **События** — 18+ событий жизненного цикла
- **Глобальные настройки** — `setGlobalSettings()` для всех попапов

### 🌍 Интернационализация
- **Поддержка языков** — русский, английский (добавляются легко)
- **Функция `t()`** — перевод с плейсхолдерами `%variable`, `@variable`, `!variable`

### 🛡 Безопасность
- Встроенное HTML-экранирование
- Защита от XSS в заголовках, действиях, URL

---

## 🚀 Быстрый старт

### Подключение

```html
<!-- jQuery (обязательно) -->
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>

<!-- XPopup -->
<link rel="stylesheet" href="xpopup/src/css/xpopup.css">
<link rel="stylesheet" href="xpopup/src/css/xpopup-skins.css">
<script src="xpopup/src/js/xpopup_utils.js"></script>
<script src="xpopup/src/js/xpopup_storage.js"></script>
<script src="xpopup/src/js/jquery.xpopup.js"></script>
<script src="xpopup/src/js/xpopup_types.js"></script>
<script src="xpopup/src/js/xpopup_window_ctrl.js"></script>
```

или так:

```html
<!-- jQuery (обязательно) -->
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>

<!-- XPopup -->
<link rel="stylesheet" href="xpopup/dist/css/xpopup.min.css">
<script src="xpopup/dist/js/jquery.xpopup.min.js"></script>
```

### Простое использование

```javascript
// Открыть изображение
$.xpopup.open({
    content: '/path/to/image.jpg'
});

// Открыть скрытый HTML
$.xpopup.open({
    type: 'inline',
    headerCaption: 'Заголовок окна',
    content: '#my-hidden-content'
});

// Закрыть
$.xpopup.close();
```

## 📖 Документация

Полная документация со всеми примерами доступна на сайте:

👉 https://xpopup.site

Там вы найдёте:

- Примеры для каждого типа контента
- Цепочки окон и кнопка «Назад»
- Галереи изображений со свайпами
- AJAX-загрузка с лоадерами
- Все скины и тёмные темы
- API и события


## 🏗️ Структура проекта

```text
xpopup/
├── css/
│   ├── xpopup.css          # Основные стили
│   └── xpopup-skins.css    # Скины и темы
├── js/
│   ├── jquery.xpopup.js    # Ядро, API, события
│   ├── xpopup_storage.js   # Управление состоянием
│   ├── xpopup_types.js     # Плагины контента
│   ├── xpopup_utils.js     # Утилиты
│   └── xpopup_window_ctrl.js # Рендеринг, анимации
└── examples/               # Примеры использования
```

## 📄 Лицензия

MIT License. 
