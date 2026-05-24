# Popup

Отображение всплывающих popup-окон на сайте.

Fast, light, responsive, skinable, configurable, extandable lightbox jQuery plugin.    
Inspired by Magnific Popup and Colorbox.

## Важные особенности ##

- Быстрый 
- Полностью конфигурируемый через data-аттрибуты элемента-триггера
- Полностью конфигурируемый через data-аттрибуты содержимого окна 
- Поддержка History API и уникальных адресов для любого popup-окна
- Поддержка скинов с возможностью одновременного применения нескольких скинов (наследование скинов)
- SKIN-плагины. Возможность програмной конфигурации окна в зависимости от выбранного плагина 
- Настройка заголовка окна и иконки окна
- Поддержка отношений "родительское окно-дочернее окно" с наследованием свойств родительского окна
- Адаптивный (ЧАСТИЧНО)
- Возможность перемещаться по стеку открытых окон, клавиша "< Назад" 
- Поддержка разных типов источников и модульность: inline, iframe, image, ajax, gallery?
- Автоопределения наиболее подходящего типа источника на основе анализа href элемента-триггера (В ПРОЦЕССЕ)
- Автоматический подбор оптимальных размеров окна с учётом текущего контента и скина
- Эффекты с использованием CSS-animations
- Обработка и отображение ошибок (ПОКА НЕТ)
- Гибкое API, для управление боксом из javascript
- Условная загрузка контента (сначала пытаемся найти inline, если нет, то выполняем загрузку) - (В ПРОЦЕССЕ)
- Два режима отображения лоадера: 
  1. при первом открытии окна - спиннер на темном фоне, 
  2. при уже открытом окне - рабочий дисплей зебеляется и поверх отображается спиннер
- Скинизация и анимация через CSS
- БЭМ-совместимость (ЧАСТИЧНО)
- Предзагрузка окон (ПОКА НЕТ) 
- Кэширование окон 
- Magnific эффект (ПОКА НЕТ)
- Поддержка Retina (ПОКА НЕТ)
- Простая, но гибкая плагинная архитектура

Пример:  

```javascript
  $('a.mylink').xpopup({content:'.node'});
```
## Как использовать

### Общие замечания:
 
-    API для программного управления окном: 
 
     Варианты программного открытия окна:   
     ```javascript
     $.xpopup.open({Опции (см.ниже)});  
     $('.xpopup-link').xpopup({Опции (см.ниже)})  
     ```
 
     Варианты программного закрытия окна:  

      ```javascript
        $.xpopup.close();
      ```
 
-    Любой элемент, имеющий классы "b-xpopup-action b-xpopup-action_type_open" открывает xpopup-окно
     Например, `<a href="https://youtube.com/<id_video>" class="b-xpopup-action b-xpopup-action_type_open">Show Video</a>`
   
-    Любой элемент, имеющий класс "ctools-use-modal" открывает xpopup-окно и делает ajax-запрос по адресу из href элемента. 
     После загрузки содержимое отображается в боксе.  
     Например, `<a href="https://{site}/login" class="ctools-user-modal">Sing In</a>`
      
-    Чтобы открыть бокс с содержимым, которое уже на странице, необходимо передать в опции content селектор этого элемента. 
     Например, `<a href="#" class="b-xpopup-action b-xpopup-action_type_open" data-xpopup-content=".b-contacts-form">Contacts Form</a>`
      
-    Любой элемент, имеющий классы "b-xpopup-action b-xpopup-action_type_close" закрывает xpopup-окно
     Например, `<a href="#" class="b-xpopup-action b-xpopup-action_type_close" >Close Box</a>`
 
-    Если внутри контента, открываемого в xpopup-окне, есть элемент с классами "b-xpopup-data-container", 
     то его data-аттрибуты будут использоваться при открытии окна. 
     Например, 

```html
  <div class="b-xpopup-data-container" 
    data-xpopup-skin='vk' 
    data-xpopup-width='50%' 
    data-xpopup-min-height='50%' 
    data-xpopup-header-caption='Test' 
    data-xpopup-header-icon-class="fas fa-user"
    data-xpopup-header-icon-url="http://{site}/logo.png"
    data-xpopup-header-icon-link="http://{site}/login"
    data-xpopup-modal="true"
    data-xpopup-showCloseBtn="true"
    data-xpopup-animation="true"
    data-xpopup-options="enableEscapeKey:true,fixedBgPos:'auto'"
  ></div>
```

### Опции

**Основные опции для открытия бокса:**

| Option                  | Values        | Description
|-------------------------|---------------|------------
| skin                    | 'default'     | например, default, vk, lite, lite.myskin
| skinMod                 | ''            | например, no-border, no-border.centered
| width                   | --            | например, '100px', '50%', '20em'
| maxWidth                | --            | например, '100px', '50%', '20em'
| minWidth                | --            | например, '100px', '50%', '20em'
| height                  | --            | например, '100px', '50%', '20em'
| maxHeight               | --            | например, '100px', '50%', '20em'
| minHeight               | --            | например, '100px', '50%', '20em'
| showCloseBtns           | 'all'         | 'all','outside','inside','none'
| headerCaption           | ''            | например, 'Отправить сообщение'
| headerSubcaption        | ''            | например, 'При отправке сообщения не забудьте оставить свои контакты'
| headerIconUrl           | 'all'         | например, http://{site}/logo.png
| headerIconClass         | 'all'         | например, fas fa-user gliphicon gliphicon-user
| headerIconLink          | 'all'         | например, http://{site}/user/1
| headerSticked           | false         | true/false. Если true, то header окна будет залипать при соприкосновении с верхней границей окна
| type                    | 'auto'        | inline, ajax, image, iframe
| content                 | --            | `"<div>Привет, <b>мир!</b></div>"` или .b-content или http://{url} или /{img_src_url}
| animation               | true          | true/false
| animationOpen           | 'slide-down'  | 'slide-down', 'slide-up','zoom-in','zoom-out','fade-in','fade-out','none'
| animactionClose         | 'slide-up'    | 'slide-down', 'slide-up','zoom-in','zoom-out','fade-in','fade-out','none'
| animationDelay          | 600           | 
| backBtn                | false         | true/false
| fullRerender            | true          | Если true, то при повторном отображении окна, взятого из кэша, его содержимое будет полностью заново загружаться и обрабатываться
| modal                   | false         | true/false
| changeUrl               | true          | Если true, то при открытии xpopup-окна будет изменяться URL в адресной строке браузера
| changeUrlHistory        | true          | Eсли true, то изменения URL будут сохраняться и отслежаваться через history api 
| closeOnContentClick     | false         | true/false
| enableEscapeKey         | true          | true/false
| fixedContentPos         | true          | true/false
| alignTop                | false         | true/false
| preloader               | true          | true/false
| prependTo               | --            | .some-inner-container
| tClose                  | 'Close (Esc)' | 
| closeMarkup             |               | `'<button title="%title%" type="button" class="b-xpopup__close">&times;</button>'`
| leftArrowUrl            | --            | Url-страницы (например, '/login/step2'), которая должна загрузиться в popup-окно при клике по стрелке
| leftArrowTitle          | --            | Если добавлено, то данный текст (например, 'Previous Image') будет отображаться при наведении курсора на стрелку
| leftArrowTarget         | --            | Например, .b-login-button
| leftArrowData           | --            | Например, {type:'inline',content:'hello!'}
| rightArrowUrl           | --            | Url-страницы (например, '/login/step2'), которая должна загрузиться в popup-окно при клике по стрелке
| rightArrowTitle         | --            | Если добавлено, то данный текст (например, 'Previous Image') будет отображаться при наведении курсора на стрелку
| rightArrowTarget        | --            | Например, .b-login-button
| rightArrowData          | --            | Например, {type:'inline',content:'hello!'}


**Использование data-аттрибутов:**

Любые из этих опций могут быть переданы с помощью data-аттрибатов элемента-триггера  
или внутри содержимого окна в виде элемента с классом "b-xpopup-data-container"


### Настройка размера окна 

1. Если размеры окна не переданы, то xpopup постарается автоматически вычислить оптимальные размеры. 

2. Для установки размеров окна можно передать любые из следующих опций:
   `width,height,maxWidth,maxHeight,minWidth,minHeight  ('100px', '50%', '20em')`

3. Для того, чтобы помочь xpopup вычислить оптимальные размеры  окна, можно сделать так:
   - в оборачивающий блочный элемент контента добавить класс b-xpopup-size. 
   - передать в настройках стиля данного элемента размеры (например, `width:100%; max-width:500px;` )
   - в этом случае при определении размеров окна xpopup найдёт этот элемент, вычислит его размеры 
     и использует их при расчете размеров окна

### Поддержка History API

Если опция `changeUrl=true` (по умолчанию эта опция установлена в true), 
то при открытии xpopup-окна меняется URL в адресной строке браузера. 

Данный URL является адресом данного xpopup-окна. Это означает, что если открыть страницу с этим URL, 
то после загрузки страницы отобразится соответствующее xpopup-окно. 
При этом, если при открытии данного окна были указаны специфичные настройки отображения окна, то они будут учтены и при 
повторном открытии.

Если опция  `changeUrlHistory=true` (по умолчанию эта опция установлена в true), то любые изменения в URL,
сделанные xpopup, сохраняются с помощью History API. 
Это означает, в частности, позволит xpopup корректно реагировать на клики по кнопкам Back/Forward браузера.

**Принцип работы**

После загрузки страницы (а также на каждое событие 'popstate' History API) 
вызывается обработчик xpopupProcessUrlHash() из jquery.xpopup_autorun.js. 
Данный обработчик проверяет наличие 'xpopup=' в хеше текущего URL.
Если такой код найден, то вся последующая часть хэша считается набором настроек для открытия xpopup-окна. 
Эти настройки обрабатываются и преобразуются в массив опций для передачи в $.xpopup.open(). 

Формат хэша следующий:

  `#xpopup=option1_name:option1_value,options2_name:option2:value`

Примеры хэшей:

  1. `#xpopup=type:ajax,content:/message/send/81847,skin:vk`
  2. `#xpopup=type:iframe,content:https://www.youtube.com/watch?v=0O2aH4XLbto`
  3. `#xpopup=type:image,content:/d6sc/car2fans/sites/default/files/user/1/brands/posters/audi.jpg`

После получения и подготовки данных для открытия окна проверяется включена ли опция changeUrl. 
Если changeUrl=true, то из исходного массива опций, переданных для открытия данного окна, формируется строка хэша 
в соответствии с описанным выше форматом. Данных хэш записывается в location.hash.

### Настройка анимации 

В опциях можно передать следующие параметры:
- animation: true, animationOpen: 'zoom-in', animationClose: 'zoom-out'
- настроить анимацию (см. CSS animation, CSS keyframes) для следующих CSS-классов: 
  - b-xpopup_animation_open-zoom-in (данный класс устанавливается при открытии окна) 
  - b-xpopup_animation_close-zoom-out (данный класс устанавливается при закрытии окна) 

### API and other

1. CSS action-классы
2. CSS option-классы
3. Плагинная архитектура
4. События и хуки

### Как добавить подвал с действиями

```php
use XSyst\Facades\Datatype;$vars['widget_classes'].= ' b-xpopup-data-container ';
$vars['widget_attrs'].=htmlTagAttrs([
  'data-xpopup-width' => 800,
  'data-xpopup-header-caption' => Page::getPageTitle(),
  'data-xpopup-footer-classes' => 'text-right',
  'data-xpopup-footer-actions' => Datatype::jsEncode([
    [ 'xtype'=>'close'],
    [ 'text' => 'Открыть ещё одно ajax-окно','classes'=>'btn btn-success ctools-use-modal', 'href'=> url('...'), 'attrs'=> ['data-xpopup-box-id' => 10] ],
  ]),
]);
```

### Как сделать залипающую шапку окна

Для того чтобы при скроллинге вниз шапка popup-окна залипала при соприкосновении с верхней частью области просмотра браузера 
достаточно установить параметр headerSticked=true. 

Пример:

```php
$vars['widget_attrs'].=htmlTagAttrs([
  'data-xpopup-sticked' => true,
]);
```


### Как добавить меню "Действия" в шапку окна

В шапке окна могут быть добавлены действия. Если действия добавлены, то в шапке окна появится иконка '...', при клике по которой отобразится выпадающиее меню всех добавленных действий.

Для управления действиями в шапке окна есть следующие 3 опции:

- **showHeaderActions** bool 
  Определяет, выводить ли меню действия в шапке окна
  Возможные значения: true|false
  Значение по умолчанию: true
- **headerActions**  Array\<Object\>
  Содержит массив действий. Каждое действие представляет собой объект со следующими свойствами:
  - **url** String
  Обязательный параметр. Адрес действия.
  - **title** String
  Обязательный параметр. Заголовок действия.
  - **classes** String
  Необязательный параметр. Классы, которые добавятся к ссылке действия.
  - **attrs** String
  Необязательный параметр. Аттрибуты, которые добавятся к ссылке действия.
  - **data** Object
    Необязательный параметр. Объект, содержащий data-аттрибуты, которые будут добавлены к ссылке действия.
- **headerActionsSelector**  String
  Необязательный параметр. Позволяет указать CSS-селектор для поиска action-ссылок внутри контента. 
  На основе найденных ссылок будет сформирован headerActions массив действий.

Для того чтобы при скроллинге вниз шапка popup-окна залипала при соприкосновении с верхней частью области просмотра браузера 
достаточно установить параметр headerSticked=true. 

Примеры:

```php
<div class='b-xalbum-viewer' data-xpopup-actions-selector=".b-xalbum-viewer__actions a">
  Здесь какая-то разметка...
</div>
```

```php
use XSyst\Facades\Datatype;$commands = [];
$commands[] = [
  'command' => 'xoverlay_display',
  'headerActions' => Datatype::jsEncode([
    [
      'title' => 'Действие 1',
      'url' => url('action1/path'),
    ],
    [
      'title' => 'Действие 2 (xpopup)',
      'url' => url('action2/path'),
      'data' => [
        'xpopupBoxId' => 100,
      ],
      'classes' => 'ctools-use-ajax',
    ],
  ]);
]
```


## Authors

- Developed by [Denis Anokhin](denis.anokhin@xlogicsoft.ru) and [Maxim Anokhin](maxim.anokhin@xlogicsoft.ru)
- Developed in http://www.xlogicsoft.ru


## License

The XPopup is open-sourced software licensed under the [MIT license](http://opensource.org/licenses/MIT).
