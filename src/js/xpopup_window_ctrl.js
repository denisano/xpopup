(function ($) {
  /**
   * Private module vars
   */
  const xpopupApi = $.xpopup;
  const xpopupUtils = xpopupApi.getUtils();
  const $window = $(window);
  const $document = $(document);
  let _cachedScrollbarSize = null; //для кэширования размеров scrollbar

  /**
   * Public functions
   */
  class XpopupWindowCtrl {
    _buildBoxElements(winData) {
      const win = this;
      const st = this.getStorage();
      const el = st.getElements();

      if (el.$box) {
        this._removeBoxElements(winData);
      }

      el.$bg = win._getEl(
        "b-xpopup b-xpopup__bg b-xpopup__bg_box-id_" + winData.boxId,
      );

      el.$box = win
        ._getEl("b-xpopup b-xpopup__box b-xpopup__box_box-id_" + winData.boxId)
        .attr("tabindex", -1);

      el.$boxAndBg = el.$box.add(el.$bg);
      el.$container = win._getEl("b-xpopup__content-container", el.$box);
      el.$headerContainer = win._getEl(
        "b-xpopup__header-container",
        el.$container,
      );
      el.$contentContainer = win._getEl("b-xpopup__content", el.$container);
      el.$footerContainer = win._getEl(
        "b-xpopup__footer-container",
        el.$container,
      );

      // ===================================================================
      // СОЗДАНИЕ ЛОАДЕРОВ
      // ===================================================================

      // Определяем тип лоадера
      const loaderType = winData.opts.loader || "pulse";
      const loaderInType = winData.opts.loaderIn || loaderType;

      // Функция для создания элемента спиннера с нужным CSS-классом.
      // Если тип совпадает с одним из встроенных — добавляем префикс 'b-xpopup-loader-spinner_'.
      // Если нет — считаем пользовательским классом и добавляем как есть.
      const makeSpinner = function (type) {
        if (!type || type === "none") return "";
        const builtinTypes = ["default", "circle", "line", "pulse"];
        const cssClass = builtinTypes.includes(type)
          ? "b-xpopup-loader-spinner_" + type
          : type;
        return (
          '<span class="b-xpopup-loader__spinner ' + cssClass + '"></span>'
        );
      };

      // ---- Внешний лоадер (при первом открытии) ----

      if (loaderType !== "none") {
        let loaderHTML = "";

        if (winData.opts.loaderPlaceholder) {
          const $placeholderSource = $(winData.opts.loaderPlaceholder);
          if ($placeholderSource.length) {
            // Безопасно: клонируем DOM-элементы вместо вставки HTML-строки
            loaderHTML = '<div class="b-xpopup-loader-placeholder"></div>';
            var $loaderPlaceholder = $(loaderHTML);
            $loaderPlaceholder.append(
              $placeholderSource.children().clone(true),
            );
            loaderHTML = $loaderPlaceholder[0].outerHTML;
            $placeholderSource.hide();
            winData._placeholderUsed = true;
          } else {
            loaderHTML = makeSpinner(loaderType);
          }
        } else {
          // Обычный спиннер — эта строка была потеряна!
          loaderHTML = makeSpinner(loaderType);
        }

        el.$loaderOut = $(
          "<div class='b-xpopup-loader b-xpopup-loader_type_out b-xpopup-option_close_on'>" +
            loaderHTML +
            "</div>",
        ).appendTo(el.$bg);
      }

      // ---- Внутренний лоадер (при обновлении контента) ----
      // Не создаём внутренний лоадер, если используется placeholder —
      // placeholder работает только для первого открытия.
      if (loaderInType !== "none" && !winData.opts.loaderPlaceholder) {
        const spinnerHTML = makeSpinner(loaderInType);
        el.$loaderIn = $(
          "<div class='b-xpopup-loader b-xpopup-loader_type_in'>" +
            spinnerHTML +
            "</div>",
        ).appendTo(el.$container);
      }

      // ===================================================================
      // АНИМАЦИЯ
      // ===================================================================

      // Анимация окна
      const $animationTarget =
        winData.opts.type === "image"
          ? null // ещё нет img, добавим в _setContent
          : el.$container;

      if ($animationTarget) {
        $animationTarget.addClass(
          winData.opts.boxAnimation == false
            ? "b-xpopup__box--animation_false"
            : "b-xpopup__box--animation_true",
        );
      }

      // Анимация фона
      el.$bg.addClass(
        winData.opts.bgAnimation == false
          ? "b-xpopup__bg--animation_false"
          : "b-xpopup__bg--animation_true",
      );
      // Размытие фона
      el.$bg.addClass(
        winData.opts.bgBlur == true
          ? "b-xpopup__bg--blur_true"
          : "b-xpopup__bg--blur_false",
      );

      // ===================================================================
      // ГАЛЕРЕЯ (статичные элементы для типа image)
      // ===================================================================
      if (winData.opts.type === "image") {
        // Счётчик изображений (внизу слева, поверх картинки)
        el.$galleryCounter = win._getEl("b-xpopup__gallery-counter", el.$box);
        el.$galleryCounter.hide(); // скрыт по умолчанию, показывается при наличии > 1 изображения в галерее

        // Действия галереи (вверху справа: скачать, zoom)
        el.$imageActions = win._getEl("b-xpopup__image-actions", el.$box);
      }

      // ===================================================================
      // STICKY HEADER
      // ===================================================================
      if (winData.opts.headerSticked) {
        el.$box.addClass("b-xpopup_has-sticked");
      }

      // ===================================================================
      // ВСТАВКА В DOM
      // ===================================================================
      el.$boxContainer = $(winData.opts.prependTo || "body");
      el.$boxHtmlContainer = $("html");
      el.$boxAndBg.prependTo(el.$boxContainer);

      // Компенсация ширины скроллбара при блокировке body
      // Применяем отступ только если скроллбар реально виден
      const hasScrollbar = xpopupUtils.isScrollbarOverlay();

      if (hasScrollbar) {
        const scrollbarWidth = win._getScrollbarSize();
        if (scrollbarWidth > 0) {
          el.$boxContainer.css({
            marginRight: scrollbarWidth + "px",
          });
        }
      }

      el.$boxContainer.css({
        overflow: "hidden",
      });

      // ===================================================================
      // Z-INDEX
      // ===================================================================
      let boxZIndex = 1000 + 10 * winData.boxId;
      if (st.activeBoxId == winData.boxId) {
        boxZIndex += 1000;
      }
      el.$box.css({
        zIndex: boxZIndex,
      });
      el.$bg.css({
        zIndex: boxZIndex - 1,
      });

      // ===================================================================
      // ОБРАБОТЧИКИ СОБЫТИЙ
      // ===================================================================
      win._bindEventListeners(winData);

      if (xpopupApi.isDebug())
        console.debug("_buildBoxElements:" + winData.boxId + "/ " + winData.id);
    } //_buildBoxElements

    _removeBoxElements(winData) {
      const st = $.xpopup.getStorage();
      const el = st.getElements();

      if (xpopupApi.isDebug())
        console.debug(
          "_removeBoxElements:" + winData.boxId + "/ " + winData.id,
        );

      // Очищаем нативные touchmove-обработчики (блокировка pull-to-refresh)
      if (el._touchMoveHandlers) {
        Object.keys(el._touchMoveHandlers).forEach(function (key) {
          var item = el._touchMoveHandlers[key];
          if (item && item.element) {
            item.element.removeEventListener("touchmove", item.handler);
          }
        });
        delete el._touchMoveHandlers;
      }

      // Вызываем disposeContent для плагина контента
      var plugin = $.xpopup.pluginGetContentTypePlugin(winData.opts.type);
      plugin.disposeContent(winData, el);

      // Удаляем бокс из хранилища
      st.deleteBox();

      // Очищаем ResizeObserver
      if (el._resizeObserver) {
        el._resizeObserver.disconnect();
        el._resizeObserver = null;
      }

      // Снимаем глобальные обработчики
      $document.add($window).off($.xpopup.EVENT_NS);
    }

    _bindEventListeners(winData) {
      const st = $.xpopup.getStorage();
      const el = st.getElements();
      const win = $.xpopup.getWindowCtrl();

      // ===================================================================
      // 1. РЕСАЙЗ ОКНА
      //    Используем requestAnimationFrame для плавности
      // ===================================================================
      let resizeTimer;
      $window.on("resize" + $.xpopup.EVENT_NS, function (e) {
        const st = $.xpopup.getStorage();
        const winData = st.getCurrentWindow();
        if (winData) {
          delete winData._cachedContentSize;
        }

        if (resizeTimer) {
          cancelAnimationFrame(resizeTimer);
        }
        resizeTimer = requestAnimationFrame(function () {
          win._updateBoxSize();
          resizeTimer = null;
        });
      });

      // ===================================================================
      // 2. КЛАВИАТУРА (document)
      //    Esc — закрыть, стрелки — навигация по галерее
      // ===================================================================
      $document.on("keyup" + $.xpopup.EVENT_NS, function (e) {
        const st = $.xpopup.getStorage();
        const curWinData = st.getCurrentWindow();
        const curEl = st.getElements();

        // Esc — закрыть окно
        if (e.keyCode === 27 && curWinData && curWinData.opts.closeOnEsc) {
          win._closeOnEsc(e);
          e.stopImmediatePropagation();
          return false;
        }

        // Стрелки для галереи (только если нет фокуса на input/textarea/select)
        var noFocus = $(":focus").filter("textarea,input,select").size() == 0;

        if (e.keyCode == 37 && curEl.$leftArrow && noFocus) {
          // Стрелка влево — предыдущее изображение
          curEl.$leftArrow.click();
          e.stopImmediatePropagation();
          return false;
        }
        if (e.keyCode == 39 && curEl.$rightArrow && noFocus) {
          // Стрелка вправо — следующее изображение
          curEl.$rightArrow.click();
          e.stopImmediatePropagation();
          return false;
        }
      });

      // ===================================================================
      // 3. МЫШЬ: КЛИК ПО БОКСУ / ФОНУ
      //    Определяем, нужно ли закрыть окно при клике
      // ===================================================================
      el.$boxAndBg.on("mousedown" + $.xpopup.EVENT_NS, function (e) {
        // Сохраняем элемент, по которому был mousedown
        // (используется в click для корректного определения цели)
        if (e.which == 1) {
          win._lastMousedownTarget = e.target;
        }
      });

      el.$boxAndBg.on("click" + $.xpopup.EVENT_NS, function (e) {
        // Закрываем меню действий в шапке при клике вне его
        if (!$(e.target).closest(".b-xpopup__header-actions-toggler").length) {
          el.$box.find(".b-xpopup__header-actions-items:visible").hide();
        }

        // Проверяем, можно ли закрыть окно
        var clickedElement = win._lastMousedownTarget;
        if (win._checkIfClose(clickedElement)) {
          win.close();
        }
        delete win._lastMousedownTarget;
      });

      // ===================================================================
      // 4. СКРОЛЛ БОКСА — STICKY HEADER
      //    Отслеживаем залипание шапки при прокрутке
      // ===================================================================
      let containerMarginTop = 0;
      el.$box.on("scroll" + $.xpopup.EVENT_NS, function (event) {
        const st = $.xpopup.getStorage();
        const el = st.getElements();
        const boxData = st.getBox();
        const winData = st.getCurrentWindow();

        // Sticky header работает только когда окно готово и опция включена
        if (boxData.windowStatus != "ready" || !winData.opts.headerSticked) {
          return;
        }

        // Кэшируем отступ контейнера
        if (containerMarginTop == 0) {
          containerMarginTop = parseInt(el.$box.css("padding-top"));
        }

        var hasStickedClass = el.$headerContainer.hasClass("_sticked");
        var scrollTop = el.$box.scrollTop();

        if (hasStickedClass && scrollTop < containerMarginTop) {
          el.$box.removeClass("b-xpopup_has-sticked");
          el.$headerContainer.removeClass("_sticked");
          el.$container.removeClass("_header-sticked");
        }
        if (!hasStickedClass && scrollTop >= containerMarginTop) {
          el.$box.addClass("b-xpopup_has-sticked");
          el.$headerContainer.addClass("_sticked");
          el.$container.addClass("_header-sticked");
        }
      });

      // ===================================================================
      // 5. HOVER ПО КОНТЕЙНЕРУ
      //    Добавляем класс при наведении на содержимое
      // ===================================================================
      el.$container.hover(
        function () {
          el.$box.addClass("b-xpopup_hover_content");
        },
        function () {
          el.$box.removeClass("b-xpopup_hover_content");
        },
      );

      // ===================================================================
      // 6. СВАЙПЫ ДЛЯ ГАЛЕРЕИ ИЗОБРАЖЕНИЙ
      //    Вертикальный свайп — закрытие
      //    Горизонтальный свайп — листание
      //    Блокировка pull-to-refresh браузера
      // ===================================================================
      if (winData.opts.type == "image") {
        let pointerStartX = 0;
        let pointerStartY = 0;
        const swipeThreshold = 50; // Минимальное расстояние для свайпа
        const swipeRatioThreshold = 1.5; // Соотношение сторон: насколько одна ось длиннее другой

        // --- Блокировка pull-to-refresh ---
        // Используем нативные addEventListener вместо jQuery,
        // чтобы избежать конфликта с jQuery-обработчиками
        var blockTouchMove = function (e) {
          e.preventDefault();
        };

        el.$box[0].addEventListener("touchmove", blockTouchMove, {
          passive: false,
        });
        el.$bg[0].addEventListener("touchmove", blockTouchMove, {
          passive: false,
        });

        // Сохраняем ссылки для очистки при закрытии бокса
        el._touchMoveHandlers = {
          box: { element: el.$box[0], handler: blockTouchMove },
          bg: { element: el.$bg[0], handler: blockTouchMove },
        };

        // --- Начало касания ---
        el.$container.on("pointerdown" + $.xpopup.EVENT_NS, function (e) {
          pointerStartX = e.originalEvent.clientX;
          pointerStartY = e.originalEvent.clientY;
        });

        // --- Завершение касания: определяем направление свайпа ---
        el.$container.on("pointerup" + $.xpopup.EVENT_NS, function (e) {
          var pointerEndX = e.originalEvent.clientX;
          var pointerEndY = e.originalEvent.clientY;

          var deltaX = pointerEndX - pointerStartX;
          var deltaY = pointerEndY - pointerStartY;
          var absDeltaX = Math.abs(deltaX);
          var absDeltaY = Math.abs(deltaY);

          // Слишком маленькое движение — не свайп (просто тап)
          if (absDeltaX < swipeThreshold && absDeltaY < swipeThreshold) {
            return;
          }

          var curWinData = st.getCurrentWindow();
          if (!curWinData || curWinData.opts.type != "image") {
            return;
          }

          var curEl = st.getElements();

          // --- Вертикальный свайп: закрытие ---
          if (absDeltaY > absDeltaX * swipeRatioThreshold) {
            if (curWinData.opts.closeOnBgClick && absDeltaY > swipeThreshold) {
              e.preventDefault();
              e.stopPropagation();
              win.close();
              return;
            }
          }

          // --- Горизонтальный свайп: навигация ---
          if (
            absDeltaX > absDeltaY * swipeRatioThreshold &&
            absDeltaX > swipeThreshold
          ) {
            // Не листаем, если фокус в поле ввода
            var noFocus =
              $(":focus").filter("textarea,input,select").size() == 0;
            if (!noFocus) {
              return;
            }

            e.preventDefault();
            e.stopPropagation();

            // Свайп влево → следующее изображение (правая стрелка)
            if (deltaX < 0 && curEl.$rightArrow) {
              curEl.$rightArrow.click();
            }
            // Свайп вправо → предыдущее изображение (левая стрелка)
            else if (deltaX > 0 && curEl.$leftArrow) {
              curEl.$leftArrow.click();
            }
          }
        });

        // --- Блокировка выделения текста при свайпе ---
        el.$container.on("selectstart" + $.xpopup.EVENT_NS, function (e) {
          e.preventDefault();
        });
      }

      // ===================================================================
      // 7. ZOOM ПО ДВОЙНОМУ КЛИКУ НА ИЗОБРАЖЕНИИ
      //    Переключает класс b-xpopup-option_zoomed_true на боксе
      // ===================================================================
      if (winData.opts.type == "image") {
        el.$container.on(
          "click" + $.xpopup.EVENT_NS,
          ".b-xpopup-image__img",
          function (e) {
            e.preventDefault();
            var $box = el.$box;
            $box.toggleClass("b-xpopup-option_zoomed_true");

            // При выходе из zoom сбрасываем скролл
            if (!$box.hasClass("b-xpopup-option_zoomed_true")) {
              $box.scrollTop(0).scrollLeft(0);
            }
          },
        );
      }

      // ===================================================================
      // 8. RESIZE OBSERVER — ОТСЛЕЖИВАНИЕ ИЗМЕНЕНИЯ РАЗМЕРА КОНТЕНТА
      //    Автоматически пересчитывает размеры бокса при изменении контента
      // ===================================================================
      var divElem = el.$contentContainer.get(0);

      if (el._resizeObserver) {
        el._resizeObserver.disconnect();
      }

      el._resizeObserver = new ResizeObserver(function (entries) {
        var newWidth = el.$contentContainer.outerWidth();
        var newHeight = el.$contentContainer.outerHeight();

        // Размер не изменился — пропускаем
        if (
          el._lastContentWidth === newWidth &&
          el._lastContentHeight === newHeight
        ) {
          return;
        }

        el._lastContentWidth = newWidth;
        el._lastContentHeight = newHeight;

        win._updateBoxSize();
      });
      el._resizeObserver.observe(divElem);
    }

    /**
     * Добавляем данные окна в стек открытых окон
     *
     * @param {[type]} options
     *   Содержит исходный объект настроек окна. Передаётся при вызове метода xpopup.open()
     * @param {[type]}
     *   Содержит элемент, являющийся триггером открытия окна. Если в данном элементе
     *   переданы данные через data-xpopup-* отрибуты, то они будут добавлены в результирующий объект настроек
     *   окна
     */
    _buildWindowData(options, triggerEl) {
      const data = {
        triggerEl: triggerEl,
        passedOptions: options || {},
        triggerOptions: _extractDataOptions(triggerEl, "trigger"),
      };

      data.autoDetectedOptions = this._autodetectOptions(data);

      data.pluginDefaults =
        $.xpopup.pluginGet("content_type." + data.autoDetectedOptions.type)
          .defaults || {};

      data.opts = {
        ...$.xpopup.defaults,
        ...data.pluginDefaults,
        // ,parentWinOptions
        ...data.autoDetectedOptions,
        ...data.passedOptions,
        // ,data.ajaxResponseOptions
        ...data.triggerOptions,
      };

      data.contentOptions = _extractContentOptions(data);

      //Получим результирующие опции для отображения окна
      data.opts = this._buildWindowResultOptions(data, true);

      //Получим исходные входные данные (для генерации id окна)
      data.initial = {
        ...data.passedOptions,
        ...data.triggerOptions,
      };
      // замена $.type на typeof
      if (!data.initial.content && typeof data.opts.content === "string") {
        data.initial.content = data.opts.content;
      }

      //Сформируем id окна
      if (data.opts.id) {
        //Было передано, то используем
        data.id = data.opts.id;
      } else {
        //Если не передано, то генерируем сами путём
        let nArgs = 0;
        let nValuesChars = 0;
        let nKeysChars = 0;
        Object.keys(data.initial).forEach(function (key) {
          nArgs++;
          nKeysChars += key.toString().length;
          nValuesChars += data.initial[key]
            ? data.initial[key].toString().length
            : 0;
        });
        data.id =
          "" +
          data.opts.type +
          "-" +
          data.opts.skin +
          "-n" +
          nArgs +
          "-ck" +
          nKeysChars +
          "-cv" +
          nValuesChars;
      }

      //Проверим, не является ли данный элемент частью галереи?
      //Если является, то произведём необходимые работы по настройке элементов этой галереи.
      //
      //Для того, чтобы popup-окно работало в режиме галереи необходимо, чтобы:
      // - каждый элемент (триггер окна) имел классы b-xpopup-gallery b-xpopup-gallery_id_{galleryId} b-xpopup-gallery__item b-xopup-gallery__item-{index}
      // - каждый элемент (триггер окна) имел data-аттрибуты data-xpopup-gallery-id, data-xpopup-gallery-index, data-xpopup-gallery-items-count
      const $triggerEl = data.triggerEl ? $(data.triggerEl) : null;

      let galleryId = data.opts.galleryId;
      if ($triggerEl) {
        //Если galleryId, не передан (в опциях или data-аттрибутах), то попытаемся его определить
        const rel = $triggerEl.attr("rel");
        if (rel && rel.indexOf("xbox") != -1) {
          //Если триггер имеет аттрибут rel вида rel=xbox[my-gallery], то  из него galleryId=xbox-my-gallery.
          //Если триггер имеет аттрибут rel='xbox', то galleryId = 'xbox'
          galleryId = rel
            .replace("]", "")
            .replace(/\s|_/g, "-")
            .replace("[", "-");
          $("[rel='" + rel + "']:not(.b-xpopup-gallery)")
            .addClass("b-xpopup-gallery")
            .data("xpopup-gallery-id", galleryId);
        } else if ($triggerEl.hasClass("b-xpopup-gallery")) {
          //Получить из чего-то подобного ' b-xpopup b-xtip b-xpopup-gallery b-xpopup-gallery_id_ggg-aaa eee'
          //вот это: ggg-aaa
          galleryId = $triggerEl.data("xpopup-gallery-id");
          if (!galleryId) {
            galleryId = "default";
            $triggerEl.data("xpopup-gallery-id", galleryId);
          }
        }
      }

      if (galleryId) {
        const $items = $(".b-xpopup-gallery").filter(function () {
          const galId = $(this).data("xpopup-gallery-id") || "default";
          if (galId === galleryId) {
            return true;
          }
          return false;
        });
        //Если элемент является частью галереи, то произведём настройку свойств каждого элемента этой галереи
        // const $items = $('.b-xpopup-gallery_id_' + galleryId);
        const galleryItemsCount = $items.size();
        //Признаком, что данный элемент уже был настроен как часть галереи, является наличие класса b-xpopup-gallery__item
        // замена $.each на нативный each (jQuery object)
        $items.each(function (index) {
          const $item = $(this);
          $item
            .addClass("b-xpopup-gallery_id_" + galleryId)
            .addClass("b-xpopup-gallery__item b-xpopup-gallery__item-" + index);
          $item.data({
            galleryId: galleryId,
            galleryItemIndex: index,
            galleryItemsCount: galleryItemsCount,
          });
        });

        data.galleryId = galleryId;
        data.galleryItemsCount = galleryItemsCount;
        data.galleryItemIndex = $items.index($triggerEl);

        //добавим в id окна данные по галерее
        data.id += "-g_" + data.galleryId;
        data.id += "-gi_" + data.galleryItemIndex;

        // пробрасываем опцию galleryLoop в данные окна
        data.galleryLoop =
          data.opts.galleryLoop !== undefined ? data.opts.galleryLoop : true;
      }

      return data;
    }

    /**
     * Перестроим результирующий массив исходных данных окна.
     * Это действие необходимо выполнить при получении контента окна,
     * поскольку именно в этот момент производится извлечение настроек окна из его контента.
     *
     * @param  {[type]} winData [description]
     * @return {[type]}         [description]
     */
    _rebuildWindowData(winData) {
      //Получим предварительные опции для отображения окна
      //Это необходимо, чтобы далее проверить winData.opts.html
      winData.opts = this._buildWindowResultOptions(winData, true);

      winData.contentOptions = _extractContentOptions(winData);
      //Получим результирующие опции для отображения окна
      winData.opts = this._buildWindowResultOptions(winData, true);

      return winData;
    }

    /**
     * Формирует результирующий объект настроек для открытия текущего окна.
     * В настоящий момент текущим является окно, данные которого в голове стека.
     *
     * Для формирования результирующего объекта настроек используется следующий алгоритм:
     * - идём от начала стека открытых окон
     * - последовательно склеиваем опции настроек окон, отдавая приоритет последним добавленным окнам
     *
     * @return
     *   Результирующий объект настроек, который можно передавать в XPopupWindow.open()
     */
    _buildWindowResultOptions(windowData) {
      let o = {};

      //Если появились опции contentOptions или ajaxResponseOptions, то необходимо перестроить o
      if (windowData.contentOptions || windowData.ajaxResponseOptions) {
        o = {
          // ,$.xpopup.defaults
          // ,windowData.pluginDefaults
          // ,windowData.autoDetectedOptions
          ...windowData.opts,
          ...windowData.passedOptions,
          ...windowData.ajaxResponseOptions,
          ...windowData.contentOptions,
          ...windowData.triggerOptions,
        };
      } else {
        o = windowData.opts;
      }

      //modal
      if (o.modal) {
        o.closeOnContentClick = false;
        o.closeOnBgClick = false;
        // o.closeBtnType = 'none';
        o.closeOnEsc = false;
      }

      //Обработаем настройки иконки окна
      const oldHi = o.headerIcon;
      let hi = null;
      if (o["headerIconUrl"]) {
        //Поддержка свойств headerIconUrl и headerIconLink
        hi = "<img src='" + o["headerIconUrl"] + "' />";
      } else if (o["headerIconClass"]) {
        //Поддержка свойств headerIconClass и headerIconLink
        hi = "<i class='" + o["headerIconClass"] + " '></i>";
      }

      if (o["headerIconLink"]) {
        hi =
          "<a href='" +
          o["headerIconLink"] +
          "' target='_blank' >" +
          hi +
          "</a>";
      }
      o.headerIcon = hi || oldHi;

      // замена $.type на typeof
      //Данные для действий в шапке
      if (
        typeof o.headerActions !== "undefined" &&
        typeof o.headerActions === "string"
      ) {
        o.headerActions = o.headerActions.trim();
        if (o.headerActions.length == 0) {
          delete o.headerActions;
        } else {
          o.headerActions = xpopupUtils.parseJson(o.headerActions, true);
        }
      }
      //Данные для подвала
      if (
        typeof o.footerActions !== "undefined" &&
        typeof o.footerActions === "string"
      ) {
        o.footerActions = o.footerActions.trim();
        if (o.footerActions.length == 0) {
          delete o.footerActions;
        } else {
          o.footerActions = xpopupUtils.parseJson(o.footerActions, true);
        }
      }

      o.mainClass = " b-xpopup_type_" + o.type;

      //Обработаем настройки скина и установим необходимые классы
      //Возможна передача нескольких скинов, разделенных '.' либо в виде индексированного массива.
      //В этом случае соответствующие классы скинов будут добавлены в том же порядке.
      //Примеры:
      //skin: 'default.default_white.default_white_big'
      //skin: ['default','default_white','default_big']

      // АВТОМАТИЧЕСКОЕ ПЕРЕКЛЮЧЕНИЕ НА ТЁМНУЮ ВЕРСИЮ СКИНА
      if (o.darkMode === true || o.darkMode === "true") {
        // Проверяем, не задан ли уже тёмный скин явно
        if (o.skin.indexOf("-dark") === -1) {
          o.skin = o.skin + "-dark";
        }
        o.mainClass = " b-xpopup_dark-mode_true";
      } else {
        o.mainClass = " b-xpopup_dark-mode_false";
      }

      const skins = Array.isArray(o.skin) ? o.skin : o.skin.split(".");
      o.skinClasses = "";
      // замена $.each на нативный forEach
      skins.forEach(function (skin, index) {
        o.skinClasses += " b-xpopup_skin_" + skin + " ";
      });
      o.mainClass += o.skinClasses;

      //skinMod
      if (o.skinMod) {
        //Если переданы модификаторы скина, то произведем обработку их.
        //Принцип такой же как был описан для скинов:
        //  Возможна передача нескольких модификаторов скинов, разделенных '.' либо в виде индексированного массива.
        //  В этом случае соответствующие классы скинов будут добавлены в том же порядке.
        //  Примеры:
        //    skinMod: 'no-borders.centered'
        //    skinMod: ['no-borders','centered']
        // замена $.isArray на Array.isArray
        const skinMods = Array.isArray(o.skinMod)
          ? o.skinMod
          : o.skinMod.split(".");
        o.skinModClasses = "";
        // замена $.each на нативный forEach
        skinMods.forEach(function (skinMod, index) {
          o.skinModClasses += " b-xpopup_skinmod_" + skinMod + " ";
        });
        o.mainClass += " " + o.skinModClasses;
      }

      if (o.name) {
        o.mainClass += " b-xpopup_name_" + o.name;
      }

      //Поддержка обработчиков событий окна (пока только boxClosed)
      if (o.eventsCommands) {
        let eventsCommands = xpopupUtils.parseJson(o.eventsCommands, true);
        // debugger
        Object.keys(eventsCommands).forEach((eventName) => {
          let commands = eventsCommands[eventName];
          if (typeof commands === "string") {
            //Пришло что-то типа {box_closed:'reload'}, т.е. commands = просто название комманды.
            //В этом случае нам нужно 'завернуть' её в массив комманд:
            commands = [
              {
                command: commands,
              },
            ];
          } else if (typeof commands === "object") {
            if (Array.isArray(commands)) {
              //Здесь ничего не нужно делать. commands = массив комманд.
            } else {
              //Пришло что-то типа {box_closed:{command:'FlashMessage', text: 'GoodBye!'} }, т.е. commands = просто объект одной комманды.
              //В этом случае нам нужно 'завернуть' её в массив комманд:
              commands = [commands];
            }
          }

          const fullEventName = "xpopup_" + eventName;
          $.xpopup.addEventCommands(fullEventName, commands);
        });
      }

      //Дадим возможность плагинам внести свои изменения
      //Например, ajax плагин здесь сможет установить content=$(winData.triggerEl).attr(href);
      $.xpopup.pluginInvokeAll("window_settings_alter", o);

      return o;
    }

    _autodetectOptions(winData) {
      if (typeof winData.autoDetectedOptions != "undefined") {
        return winData.autoDetectedOptions;
      }

      const imageRegexp = /.(gif|png|jp(e|g|eg)|bmp|ico|webp|jxr|svg)(\?.*)?$/i; // name.jpg, name.png?t=34
      const schemaRegexp = /^(\/|http:|https:)/; // http:, https:, /
      const inlineContentRegexp = /^#/; // Селектор inline-контента начинается с #
      const javascriptProtocolRegexp = /^javascript:/; // javascript:void(0) и подобное

      const o = {};

      // Сначала собираем тип и контент из переданных опций
      o.type = winData.triggerOptions ? winData.triggerOptions.type : null;
      o.type =
        o.type || (winData.passedOptions ? winData.passedOptions.type : null);

      o.content = winData.triggerOptions
        ? winData.triggerOptions.content
        : null;
      o.content =
        o.content ||
        (winData.passedOptions ? winData.passedOptions.content : null);

      o.boxId = winData.triggerOptions ? winData.triggerOptions.boxId : null;
      o.boxId =
        o.boxId || (winData.passedOptions ? winData.passedOptions.boxId : null);

      // Извлекаем URL из триггера, если контент ещё не задан
      // Это нужно для ВСЕХ типов, включая inline
      if (!o.content && winData.triggerEl) {
        let url = winData.triggerEl.getAttribute("href");

        // Пропускаем javascript: ссылки
        if (url && javascriptProtocolRegexp.test(url)) {
          url = null;
        }

        // Если href не подходит, пробуем src (для изображений)
        if (!url) {
          url = winData.triggerEl.getAttribute("src");
        }

        // Если нашли подходящий URL — используем его
        if (url) {
          o.content = url;
        }
      }

      /// Автоматическое определение типа контента ///

      // Если тип НЕ указан явно — пытаемся определить автоматически
      if (!o.type) {
        if (o.content) {
          // Проверяем, является ли контент изображением
          if (imageRegexp.test(o.content)) {
            o.type = "image";
            o.boxId = 20; // Специальный boxId для изображений
          }
          // Проверяем, является ли это селектором inline-контента
          else if (inlineContentRegexp.test(o.content)) {
            o.type = "inline";
          }
          // Проверяем на schema (http://, https://, /)
          else if (schemaRegexp.test(o.content)) {
            // Локальный URL — загружаем через AJAX
            if (!xpopupUtils.urlIsLocal(o.content)) {
              o.type = "iframe";
            } else {
              o.type = "ajax";
            }
          }
          // Всё остальное считаем inline
          else {
            o.type = "inline";
          }
        } else {
          // Если контент не найден, но есть триггер — пытаемся получить из следующего элемента
          if (winData.triggerEl && winData.triggerEl.nextElementSibling) {
            const nextEl = winData.triggerEl.nextElementSibling;
            if (nextEl.style && nextEl.style.display === "none") {
              // Это скрытый элемент — используем его как inline-контент
              o.type = "inline";
            }
          }
        }
      }

      // Если тип всё ещё не определён — по умолчанию inline
      if (!o.type) {
        o.type = "inline";
      }

      // Для типов, требующих загрузки контента (image, iframe),
      // дополнительно проверяем URL
      if (o.type == "image" || o.type == "iframe") {
        if (!o.content && winData.triggerEl) {
          o.content =
            winData.triggerEl.getAttribute("href") ||
            winData.triggerEl.getAttribute("src");
        }
      }

      return o;
    }

    /**
     * Начинаем процесс получения данных для отображения в боксе.
     *
     * @param  data [description]
     */
    fetchContent() {
      const win = this;
      const st = this.getStorage();
      const boxData = st.getBox();
      const newWinData = st.getBoxNewWindow();
      const el = st.getElements();

      if (!boxData.status) {
        win._buildBoxElements(newWinData);
        win.getBoxCtrl().setBoxStatus("opening");
        $.xpopup.emit($.xpopup.EVENT_BOX_OPEN_BEFORE);
      }
      win._updateBgAnimation("box-open");

      // Блокировка прокрутки body
      el.$boxHtmlContainer.addClass("b-html-xpopup");

      if (newWinData.opts.bodyScrollable) {
        el.$boxHtmlContainer.addClass("b-html-xpopup_scrollable");
      } else {
        el.$boxHtmlContainer.removeClass("b-html-xpopup_scrollable");
      }

      win.setWindowStatus("loading");
      $.xpopup.emit($.xpopup.EVENT_WINDOW_LOADING);

      // Обычное поведение без задержки
      if (newWinData.opts.html) {
        win._renderContent();
      } else {
        const plugin = $.xpopup.pluginGetContentTypePlugin(
          newWinData.opts.type,
        );
        plugin.fetchAndBuildContent(
          function (winData, beforeRenderCallback) {
            if (beforeRenderCallback) beforeRenderCallback(winData);
            win._renderContent();
          },
          function (winData, errMsg, beforeRenderCallback) {
            if (beforeRenderCallback) beforeRenderCallback(winData);
            win.setWindowStatus("error", errMsg);
            win._renderContent();
          },
        );
      }
    }

    /**
     * Контент окна получен и готов для показа. Произведем обновление окна.
     *
     * @return {[type]}                   [description]
     */
    _renderContent() {
      const win = this;
      const st = this.getStorage();
      const oldWinData = st.getCurrentWindow();
      const newWinData = st.getBoxNewWindow();

      if (xpopupApi.isDebug())
        console.debug(
          "_renderContent, boxData.status:",
          st.getBox().status,
          "newWinData.id:",
          st.getBoxNewWindow()?.id,
        );

      if (!newWinData) {
        return;
      }

      // Обычный рендер
      win._performRender(newWinData, oldWinData);
    }

    /**
     * Выполняет фактический рендер контента (вставка в DOM, обновление шапки, подвала и т.д.).
     * Выделен в отдельный метод для удобства восприятия и отладки
     *
     * @param {object} winData - данные окна для рендера
     */
    _performRender(winData, oldWinData) {
      const win = this;
      const st = this.getStorage();
      let el = st.getElements();
      let boxData = st.getBox();

      $.xpopup.emit($.xpopup.EVENT_WINDOW_RENDER_CONTENT_BEFORE);

      // Перестраиваем результирующие опции с учётом контента
      win._rebuildWindowData(winData);

      // Проверка на смену boxId
      if (
        typeof winData.opts.boxId !== "undefined" &&
        winData.opts.boxId != boxData.id
      ) {
        st.removeWindowFromBox(winData.id);
        st.activateBox(winData.opts.boxId);
        st.addWindowToBox(winData);

        boxData = st.getBox();

        if (!boxData.status) {
          win._buildBoxElements(winData);
          win.getBoxCtrl().setBoxStatus("opening");
          $.xpopup.emit($.xpopup.EVENT_BOX_OPEN_BEFORE);
          el = st.getElements();
        }
      }

      // Переключаем текущее активное окно
      st.setCurWindow(winData.id);

      // Вставка контента
      win._setContent(winData, oldWinData);
      win._updateBoxSize();

      // Показываем бокс — контент готов к отображению
      if (el.$box) {
        el.$box.css("visibility", "visible");
      }

      // контент добавлен в dom-модель, можно запускать анимацию его отображения (если анимация требуется)
      const boxAnimPromise = win._updateBoxAnimation("box-open");
      //Если есть анимация открытия бокса, то расчёт позиции outsize closeBtn только после завершения анимации и уточнения размеров окна
      if (
        boxAnimPromise &&
        // (winData.opts.closeBtnType == "outside" ||
        //   (winData.opts.closeBtnType == "auto" && !winData.opts.headerHide))
        winData.opts.closeBtnType == "outside"
      ) {
        el.$closeBtn.css({ opacity: "0" }); //необходимо скрыть иконку пока анимация окна не завершится
        boxAnimPromise.then(() => {
          win._updateBoxSize();
          el.$closeBtn.css({ opacity: "1" }); //анимация окна завершена, размеры определены, теперь иконку можно показывать
        });
      } else {
        win._updateBoxSize();
      }

      // Первое открытие бокса
      if (boxData.status != "opened") {
        if (xpopupApi.isDebug())
          console.debug("_performRender: boxData.status =", boxData.status);

        this.getBoxCtrl().setBoxStatus("opened");
        $.xpopup.emit($.xpopup.EVENT_BOX_OPEN_AFTER);
      }
      // Окно полностью готово
      win.setWindowStatus("ready");
      $.xpopup.emit($.xpopup.EVENT_WINDOW_READY);
    }

    /**
     * Set HTML content of popup.
     *
     * Этот метод вызывается каждый раз, когда контент попапа обновляется:
     * - при первом открытии окна
     * - при смене кадра в галерее (стрелки влево/вправо)
     * - при программном обновлении контента
     *
     * Он отвечает за:
     * - вставку нового HTML-контента
     * - перестроение шапки (header)
     * - перестроение подвала (footer)
     * - обновление стрелок навигации (для галереи)
     * - обновление классов на $box (скины, опции, флаги header/footer)
     * - активацию xpopup-действий внутри нового контента
     * - обновление счётчика галереи
     * - обновление кнопок действий изображения (share, download)
     * - работу с History API
     *
     * @param {winData}
     * @param {oldWinData}
     */
    _setContent(winData, oldWinData) {
      const win = this;
      const st = win.getStorage();
      const el = st.getElements(winData);

      const newContent = winData.opts.html;
      const type = winData.opts.type;

      if (xpopupApi.isDebug())
        console.debug(
          "_setContent() called, $box in DOM:",
          el.$box && document.body.contains(el.$box[0]),
        );

      // Уведомляем плагины о предстоящей смене контента
      $.xpopup.emit($.xpopup.EVENT_WINDOW_CHANGE_BEFORE);

      // ===================================================================
      // Сброс настроек залипания (sticky header)
      // ===================================================================
      if (winData.opts.headerSticked) {
        el.$box.find(".b-xpopup-stick-top").each(function () {
          const $this = $(this);
          $this
            .removeData("savedScrollTop")
            .removeData("savedWidth")
            .removeClass("b-xpopup-stick-top-active")
            .css({ top: "auto" })
            .outerWidth("auto");
        });
      }

      // ===================================================================
      // Удаление старого контента перед вставкой нового
      // ===================================================================
      if (el.$content) {
        if (xpopupApi.isDebug())
          console.debug(
            "_setContent before call plugin.disposeContent()",
            oldWinData,
            winData,
          );
        if (oldWinData && oldWinData.id != winData.id) {
          const plugin = $.xpopup.pluginGetContentTypePlugin(
            oldWinData.opts.type,
          );
          plugin.disposeContent(oldWinData, el);
          // Сбрасываем кэш размеров при смене контента
          delete oldWinData._cachedContentSize;
          delete oldWinData._isFixedSize;
        }
      }

      // Устанавливаем новый контент
      el.$content = $(newContent);

      // ===================================================================
      // Перестроение шапки (header)
      // ===================================================================
      const hasHeader = win._buildHeader(el.$headerContainer);

      if (hasHeader) {
        el.$box.addClass("b-xpopup_has-header_true");
        el.$box.removeClass("b-xpopup_has-header_false");
      } else {
        el.$box.addClass("b-xpopup_has-header_false");
        el.$box.removeClass("b-xpopup_has-header_true");
      }

      // ===================================================================
      // Перестроение подвала (footer)
      // ===================================================================
      const hasFooter = win._buildFooter(el.$footerContainer);

      if (hasFooter) {
        el.$box.addClass("b-xpopup_has-footer_true");
        el.$box.removeClass("b-xpopup_has-footer_false");
      } else {
        el.$box.addClass("b-xpopup_has-footer_false");
        el.$box.removeClass("b-xpopup_has-footer_true");
      }

      // ===================================================================
      // Вставка контента в DOM
      // ===================================================================
      el.$content.appendTo(el.$contentContainer);

      // ===================================================================
      // Счётчик галереи
      // ===================================================================
      if (el.$galleryCounter) {
        const galleryItemsCount = winData.galleryItemsCount;
        const galleryItemIndex = winData.galleryItemIndex;

        if (galleryItemsCount > 1 && galleryItemIndex !== undefined) {
          el.$galleryCounter
            .text(galleryItemIndex + 1 + " / " + galleryItemsCount)
            .show();
        } else {
          el.$galleryCounter.hide();
        }
      }

      // ===================================================================
      // Кнопки действий для изображений (share, download)
      // ===================================================================
      if (el.$imageActions) {
        let actionsHtml = "";

        const shareAction = winData.opts.imageShareAction || "auto";
        let showShare = false;

        if (shareAction === "always") {
          showShare = true;
        } else if (shareAction === "auto") {
          showShare =
            winData.opts.share === true || winData.opts.share === "true";
        }

        if (showShare) {
          const iconTitle = xpopupApi.t("Label__Share", null, winData);
          actionsHtml +=
            '<a href="javascript:void(0);" class="b-xpopup__image-action b-xpopup__image-action_share b-xpopup-option_close_off" title="' +
            iconTitle +
            '"></a>';
        }

        const downloadAction = winData.opts.imageDownloadAction || "auto";
        let showDownload = false;
        let downloadUrl = winData.opts.downloadUrl;

        if (downloadAction === "always") {
          showDownload = true;
          if (!downloadUrl) {
            downloadUrl = winData.opts.content;
          }
        } else if (downloadAction === "auto") {
          showDownload = !!downloadUrl;
        }

        if (showDownload && downloadUrl) {
          const iconTitle = xpopupApi.t("Label__Download", null, winData);
          actionsHtml +=
            '<a href="' +
            xpopupApi.escapeHtml(downloadUrl) +
            '" target="_blank" download class="b-xpopup__image-action b-xpopup__image-action_download b-xpopup-option_close_off" title="' +
            iconTitle +
            '"></a>';
        }

        el.$imageActions.html(actionsHtml);

        const $shareBtn = el.$imageActions.find(
          ".b-xpopup__image-action_share",
        );
        if ($shareBtn.length && navigator.share) {
          $shareBtn.on("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            navigator
              .share({
                url: winData.opts.content,
                title: winData.opts.headerCaption || "",
              })
              .catch(function () {});
          });
        }
      }

      // ===================================================================
      // Стрелки навигации
      // ===================================================================
      win._updateArrow("left");
      win._updateArrow("right");

      el.$box
        .removeClass("b-clicked-arrow_left")
        .removeClass("b-clicked-arrow_right");

      if (el.$leftArrow) el.$leftArrow.removeClass("b-xpopup__arrow_active");
      if (el.$rightArrow) el.$rightArrow.removeClass("b-xpopup__arrow_active");

      if (winData.opts.clickedArrow) {
        const newDirection = winData.opts.clickedArrow;
        el.$box.addClass("b-clicked-arrow_" + newDirection);

        if (newDirection === "left" && el.$leftArrow) {
          el.$leftArrow.addClass("b-xpopup__arrow_active");
        } else if (newDirection === "right" && el.$rightArrow) {
          el.$rightArrow.addClass("b-xpopup__arrow_active");
        }
      }

      // ===================================================================
      // Активация xpopup-действий
      // ===================================================================
      el.$container.find(".b-xpopup-action").xpopup();

      // ===================================================================
      // Обновление классов скина и опций
      // ===================================================================
      xpopupUtils.replaceClassesByPrefixes(
        el.$box,
        [
          "b-xpopup_skin",
          "b-xpopup_skinmod",
          "b-xpopup-option",
          "b-xpopup_type",
          "b-xpopup_name",
        ],
        winData.opts.mainClass,
        el.$boxAndBg,
      );

      // ===================================================================
      // Классы опций закрытия
      // ===================================================================
      const $realContent =
        winData.opts.type === "image"
          ? el.$container.find(".b-xpopup-image__anim-layer") //для изображений
          : el.$container;
      if (winData.opts.closeOnContentClick) {
        $realContent
          .removeClass("b-xpopup-option_close_off")
          .addClass("b-xpopup-option_close_on");
      } else {
        $realContent
          .removeClass("b-xpopup-option_close_on")
          .addClass("b-xpopup-option_close_off");
      }

      if (winData.opts.closeOnBgClick) {
        el.$boxAndBg
          .removeClass("b-xpopup-option_close_off")
          .addClass("b-xpopup-option_close_on");
      } else {
        el.$boxAndBg
          .removeClass("b-xpopup-option_close_on")
          .addClass("b-xpopup-option_close_off");
      }

      // ===================================================================
      // Кнопка "Назад"
      // ===================================================================
      if (winData.parentId) {
        el.$boxAndBg.addClass("b-xpopup_has-parent-id");
        if (winData.opts.backBtn) {
          el.$boxAndBg.addClass("b-xpopup_has-back");
        } else {
          el.$boxAndBg.removeClass("b-xpopup_has-back");
        }
      } else {
        el.$boxAndBg.removeClass("b-xpopup_has-parent-id");
        el.$boxAndBg.removeClass("b-xpopup_has-back");
      }

      // ===================================================================
      // Классы анимации
      // ===================================================================
      const $boxAnimTarget =
        winData.opts.type === "image"
          ? el.$container.find(".b-xpopup-image__anim-layer")
          : el.$container;

      if ($boxAnimTarget.length) {
        $boxAnimTarget
          .removeClass(
            "b-xpopup__box--animation_false b-xpopup__box--animation_true",
          )
          .addClass(
            winData.opts.boxAnimation == false
              ? "b-xpopup__box--animation_false"
              : "b-xpopup__box--animation_true",
          );
      }

      el.$bg
        .removeClass(
          "b-xpopup__bg--animation_false b-xpopup__bg--animation_true",
        )
        .addClass(
          winData.opts.bgAnimation == false
            ? "b-xpopup__bg--animation_false"
            : "b-xpopup__bg--animation_true",
        );

      el.$bg
        .removeClass("b-xpopup__bg--blur_false b-xpopup__bg--blur_true")
        .addClass(
          winData.opts.bgBlur == false
            ? "b-xpopup__bg--blur_false"
            : "b-xpopup__bg--blur_true",
        );

      $.xpopup.emit($.xpopup.EVENT_WINDOW_CHANGE_AFTER);

      // ===================================================================
      // HISTORY API
      // ===================================================================
      if (winData.opts.changeUrl) {
        let hash = [];
        Object.keys(winData.initial).forEach(function (key) {
          const value = winData.initial[key];
          const type = typeof value;
          if (type === "object" || type === "array") return;

          hash.push(key + ":" + encodeURIComponent(value));
        });

        if (hash.length > 0) {
          if (!winData._oldDocumentUrl) {
            winData._oldDocumentUrl = location.toString();
            winData._oldDocumentTitle = document.title;
          }

          const hashStr = "#xpopup=" + hash.join(",");

          const histApi = xpopupUtils.getHistoryApi();
          if (histApi) {
            const title = document.title + ":" + winData.opts.headerCaption;
            if (winData.opts.changeUrlHistory && hashStr != location.hash)
              histApi.pushState("", title, hashStr);
            else histApi.replaceState("", title, hashStr);
          } else {
            location.hash = hashStr;
          }
        }
      }
    }

    /**
     * добавлен параметр errorMessage для передачи текста ошибки
     */
    setWindowStatus(newStatus, errorMessage) {
      const boxData = this.getStorage().getBox();
      const el = this.getStorage().getElements();

      if (xpopupApi.isDebug())
        console.debug(
          "setWindowStatus():",
          "newStatus: " + newStatus,
          "oldStatus: " + boxData.windowStatus,
        );

      if (!newStatus || newStatus == boxData.windowStatus) {
        return false;
      }

      const oldStatus = boxData.windowStatus;
      boxData.windowStatus = newStatus;

      // сохраняем сообщение об ошибке в данных бокса для возможного использования
      if (newStatus === "error" && errorMessage) {
        boxData.errorMessage = errorMessage;
      } else if (newStatus !== "error") {
        boxData.errorMessage = null;
      }

      if (el.$bg && el.$box) {
        xpopupUtils.replaceClassesByPrefixes(
          el.$box,
          "b-xpopup_status",
          " b-xpopup_status_" + boxData.windowStatus,
          el.$boxAndBg,
        );
      }

      $.xpopup.emit($.xpopup.EVENT_WINDOW_NEW_STATUS, {
        newStatus: boxData.windowStatus,
        oldStatus: oldStatus,
      });
      return true;
    }

    _closeOnEsc(event) {
      const st = this.getStorage();
      const winData = st.getCurrentWindow();

      if (winData.isFullScreen) {
        //Если мы фуллскрин режиме (например, при просмотре галереи через плагин fotorama),
        //то по Esc не нужно закрывать окно.
        return false;
      }
      this.close();
    }

    /**
     * Использует событие animationend для точной синхронизации
     * завершения CSS-анимации и удаления бокса из DOM.
     * Если анимация отключена (boxAnimation: false или boxAnimationClose: 'none'),
     * бокс удаляется немедленно.
     */
    close() {
      if (xpopupApi.isDebug()) console.debug("XpopupWidowCtrl.close called");

      const win = this;
      const st = this.getStorage();
      const winData = st.getCurrentWindow();
      const boxCtrl = this.getBoxCtrl();
      const el = st.getElements();
      const closePopup = st.countUsableBoxes() <= 1;

      if (!winData) {
        return false;
      }

      $.xpopup.emit($.xpopup.EVENT_BOX_CLOSE_BEFORE);

      const boxAnimPromise = win._updateBoxAnimation("box-close");
      const bgAnimPromise = win._updateBgAnimation("box-close");

      // Меняем статус только если есть хотя бы одна анимация
      if (boxAnimPromise || bgAnimPromise) {
        win.setWindowStatus("closing");
        boxCtrl.setBoxStatus("closing");
      }

      // Если box-анимация отключена — мгновенно скрываем контейнер.
      // BG -анимация (если есть) продолжается независимо.
      if (!boxAnimPromise && el.$container) {
        el.$container.css({
          opacity: 0,
          visibility: "hidden",
        });
      }

      $.xpopup.emit($.xpopup.EVENT_BOX_CLOSING);

      // st.setBoxNewWindow(null);

      // win.setWindowStatus("closed");

      // ===================================================================
      // HISTORY API
      // ===================================================================
      if (winData.opts.changeUrl && winData._oldDocumentUrl) {
        const i = winData._oldDocumentUrl.indexOf("#xpopup=");
        if (i !== -1) {
          winData._oldDocumentUrl = winData._oldDocumentUrl.substr(0, i);
        }

        const histApi = xpopupUtils.getHistoryApi();
        if (histApi) {
          if (winData.opts.changeUrlHistory)
            histApi.pushState(
              "",
              winData._oldDocumentTitle,
              winData._oldDocumentUrl,
            );
          else
            histApi.replaceState(
              "",
              winData._oldDocumentTitle,
              winData._oldDocumentUrl,
            );
        } else {
          window.location = winData._oldDocumentUrl;
          document.title = winData._oldDocumentTitle;
        }
        winData._oldDocumentUrl = null;
        winData._oldDocumentTitle = null;
      }

      // Сохраняем ссылки до удаления DOM
      const $boxContainer = el.$boxContainer;
      const $boxHtmlContainer = el.$boxHtmlContainer;

      // ===================================================================
      // Функция финального закрытия (удаление DOM, очистка событий)
      // ===================================================================
      const _finishClosingCallback = function () {
        $.xpopup.emit($.xpopup.EVENT_WINDOW_DISPOSE_BEFORE);
        $.xpopup.emit($.xpopup.EVENT_WINDOW_DISPOSE_AFTER);

        boxCtrl.setBoxStatus("closed");
        $.xpopup.emit($.xpopup.EVENT_BOX_CLOSE_AFTER);
        $.xpopup.emit($.xpopup.EVENT_BOX_CLOSED);

        if (closePopup) {
          $boxContainer
            .removeClass("b-body-xpopup")
            .css({ marginRight: "", overflow: "auto" });
          $boxHtmlContainer
            .removeClass("b-html-xpopup")
            .removeClass("b-html-xpopup_scrollable");
          $document.off(
            "keyup" + $.xpopup.EVENT_NS + " focusin" + $.xpopup.EVENT_NS,
          );
          $document.add($window).off($.xpopup.EVENT_NS);
          $.xpopup.emit($.xpopup.EVENT_POPUP_CLOSED);
        }
        win._removeBoxElements(winData);
        win.setWindowStatus("closed");
      };

      // ===================================================================
      // Синхронизация с анимациями
      // ===================================================================
      const promises = [];
      if (boxAnimPromise) promises.push(boxAnimPromise);
      if (bgAnimPromise) promises.push(bgAnimPromise);

      if (promises.length > 0) {
        // Ждём завершения всех анимаций
        Promise.all(promises)
          .then(function () {
            _finishClosingCallback();
          })
          .catch(function () {
            // При ошибке в анимации — закрываем в любом случае
            _finishClosingCallback();
          });
      } else {
        // Нет анимаций — закрываем мгновенно
        _finishClosingCallback();
      }
    }

    _updateBoxSize() {
      //Если размер окна изменился, необходимо пересчитать размер popup
      this._updateContainerSizes();
    }

    // Check to close popup or not
    // "target" is an element that was clicked
    //
    // оптимизация - замена $target.parents('body').size() != 0 на document.body.contains(target)
    _checkIfClose(target) {
      const $target = $(target);

      // Кнопка закрытия — всегда разрешаем закрыть
      if ($target.closest(".b-xpopup__close").length) {
        return true;
      }

      // Кнопка ЗАКРЫТИЯ в футере (b-xpopup-action_type_close) — разрешаем
      if ($target.closest(".b-xpopup-action_type_close").length) {
        return true;
      }

      // Остальные xpopup-действия (открыть, назад) — не закрываем
      if ($target.closest(".b-xpopup-action").length) {
        return false;
      }

      //Check close options
      const onEl = $target.closest(".b-xpopup-option_close_on")[0];
      const offEl = $target.closest(".b-xpopup-option_close_off")[0];

      if (onEl && offEl) {
        if ($.contains(onEl, offEl)) {
          return false;
        }
      } else if (onEl) {
        return true;
      } else if (offEl) {
        return false;
      }

      return false;
    }

    _hasScrollBar(winHeight) {
      const st = this.getStorage();

      return document.body.scrollHeight > (winHeight || $window.height());
    }

    _getScrollbarSize() {
      if (_cachedScrollbarSize !== null) {
        return _cachedScrollbarSize;
      }

      const scrollDiv = document.createElement("div");
      scrollDiv.style.cssText =
        "width: 99px; height: 99px; overflow: scroll; position: absolute; top: -9999px;";
      document.body.appendChild(scrollDiv);
      _cachedScrollbarSize = scrollDiv.offsetWidth - scrollDiv.clientWidth;
      document.body.removeChild(scrollDiv);

      return _cachedScrollbarSize;
    }

    _getEl(className, appendTo, html, raw) {
      if (className == "b-xpopup__content") {
        className += " b-xpopup-clearfix";
      }

      if (raw) {
        const el = document.createElement("div");
        el.className = className;
        if (html) {
          el.innerHTML = html;
        }
        if (appendTo) {
          appendTo.appendChild(el);
        }
        return el;
      }

      const $el = $("<div>").addClass(className);
      if (html) {
        $el.html(html);
      }
      if (appendTo) {
        $el.appendTo(appendTo);
      }
      return $el;
    }

    /**
     * Запускает анимацию бокса через Web Animations API.
     *
     * @param {string} animationType - 'box-open' или 'box-close'
     * @returns {Promise|null} - Promise, который резолвится после завершения анимации,
     *                           или null, если анимация отключена
     */
    _updateBoxAnimation(animationType) {
      const st = this.getStorage();
      const winData = st.getCurrentWindow();
      const el = st.getElements();
      // debugger;
      if (!winData || !winData.opts.boxAnimation) {
        return null;
      }

      //Если бокс уже открыт, то анимация 'box-open' не нужна
      if (animationType == "box-open" && st.hasOpenBoxes()) {
        return null;
      }

      // Цель анимации
      const $target =
        winData.opts.type === "image"
          ? el.$container.find(".b-xpopup-image__anim-layer")
          : el.$container;

      if (!$target.length) return null;

      // Определяем эффект
      const effectName =
        animationType === "box-open"
          ? winData.opts.boxAnimationOpen
          : winData.opts.boxAnimationClose;

      if (!effectName || effectName === "none") {
        return null;
      }

      // Словарь ключевых кадров (keyframes) для каждого эффекта
      const keyframesMap = {
        // === Открытие ===
        "fade-in": [
          { opacity: 0, offset: 0 },
          { opacity: 1, offset: 1 },
        ],
        "slide-down": [
          { opacity: 0, transform: "translateY(-50px)", offset: 0 },
          { opacity: 1, transform: "translateY(0)", offset: 1 },
        ],
        "zoom-in": [
          { opacity: 0, transform: "scale(0.7)", offset: 0 },
          { opacity: 1, transform: "scale(1)", offset: 1 },
        ],
        "zoom-out": [
          { opacity: 0, transform: "scale(1.3)", offset: 0 },
          { opacity: 1, transform: "scale(1)", offset: 1 },
        ],

        // === Закрытие ===
        "fade-out": [
          { opacity: 1, offset: 0 },
          { opacity: 0, offset: 1 },
        ],
        "slide-up": [
          { opacity: 1, transform: "translateY(0)", offset: 0 },
          { opacity: 0, transform: "translateY(-50px)", offset: 1 },
        ],
        "zoom-out": [
          { opacity: 1, transform: "scale(1)", offset: 0 },
          { opacity: 0, transform: "scale(0.7)", offset: 1 },
        ],
      };

      const keyframes = keyframesMap[effectName];
      if (!keyframes) {
        console.warn("XPopup: unknown animation effect:", effectName);
        return null;
      }

      // Настройки длительности для каждого эффекта
      const timingMap = {
        "fade-in": { duration: 300, easing: "ease", fill: "both" },
        "slide-down": { duration: 250, easing: "ease", fill: "both" },
        "zoom-in": {
          duration: 220,
          easing: "cubic-bezier(.25, .46, .45, .94)",
          fill: "both",
        },
        "fade-out": { duration: 200, easing: "ease", fill: "both" },
        "slide-up": { duration: 200, easing: "ease", fill: "both" },
        "zoom-out": {
          duration: 200,
          easing: "cubic-bezier(.55, .055, .675, .19)",
          fill: "both",
        },
      };

      const timing = timingMap[effectName] || {
        duration: 300,
        easing: "ease",
        fill: "both",
      };

      // Запускаем анимацию
      const animation = $target[0].animate(keyframes, timing);

      // Возвращаем Promise, который резолвится после завершения
      return animation.finished;
    }

    /**
     * Запускает анимацию фона через Web Animations API.
     *
     * @param {string} animationType - 'box-open' или 'box-close'
     * @returns {Promise|null}
     */
    _updateBgAnimation(animationType) {
      const st = this.getStorage();
      const winData = st.getCurrentWindow();
      const el = st.getElements();

      if (!winData || !el.$bg) {
        return null;
      }

      //Если бокс уже открыт, то анимация 'box-open' не нужна
      if (animationType == "box-open" && st.hasOpenBoxes()) {
        return null;
      }

      if (animationType === "box-open") {
        if (!winData.opts.bgAnimation) {
          // Без анимации — мгновенно показываем фон
          el.$bg.css("opacity", 1);
          return null;
        }
        // С анимацией
        const animation = el.$bg[0].animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 300,
          easing: "ease",
          fill: "both",
        });
        return animation.finished;
      }

      if (animationType === "box-close") {
        if (!winData.opts.bgAnimation) {
          // Без анимации — мгновенно скрываем фон
          el.$bg.css("opacity", 0);
          return null;
        }
        // С анимацией
        const animation = el.$bg[0].animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: 200,
          easing: "ease",
          fill: "both",
        });
        return animation.finished;
      }

      return null;
    }

    _buildHeader($headerContainer, calcMode) {
      const st = this.getStorage();
      const winData = st.getCurrentWindow();
      const el = st.getElements();
      const type = winData.opts.type;

      let hasHeader = false;

      if (winData.opts.headerCaption && !winData.opts.headerHide) {
        let caption = winData.opts.headerCaption;
        let captionIsSelector = winData.opts.headerCaptionIsSelector ?? false;
        let headerCaption = null;
        let headerIcon = "";
        let headerBack = "";
        let headerActions = "";
        let headerClasses = "b-xpopup__header";

        if (caption) {
          if (
            captionIsSelector &&
            typeof caption == "string" &&
            caption.charAt(0) == "."
          ) {
            caption = $(caption, winData.opts.html).html();
          } else {
            caption =
              "<span class='b-xtip' title='" +
              caption +
              "'>" +
              caption +
              "</span>";
          }
        }

        if (type != "image") {
          if (winData.opts.headerSticked) {
            $headerContainer.addClass("b-xpopup-stick-top");
          }
          if (winData.opts.headerSubcaption) {
            let subcaption = winData.opts.headerSubcaption;
            if (typeof subcaption == "string" && subcaption.charAt(0) == ".") {
              subcaption = $(subcaption, winData.opts.html).html();
            }
            if (subcaption) {
              headerCaption =
                "<div class='b-xpopup__header-caption'>" +
                caption +
                "<div class='b-xpopup__header-subcaption'>" +
                subcaption +
                "</div></div>";
              headerClasses += " b-xpopup__header_has-subcaption";
            }
          }
          if (!headerCaption) {
            headerCaption =
              "<div class='b-xpopup__header-caption'>" + caption + "</div>";
          }
          if (winData.opts.headerIcon) {
            headerIcon =
              "<div class='b-xpopup__header-icon'>" +
              winData.opts.headerIcon +
              "</div>";
            headerClasses += " b-xpopup__header_has-icon";
          }
          if (winData.opts.backBtn && winData.parentId) {
            const iconTitle = xpopupApi.t("Label__Back", null, winData);

            headerBack =
              "<span title='" +
              iconTitle +
              "' class='b-xpopup__back b-xpopup-action b-xpopup-action_type_back'><span class='b-xpopup-ico b-xpopup-ico_back'></span></span>";
            headerClasses += " b-xpopup__header_has-back";
          }

          if (
            !calcMode &&
            !winData.opts.headerActionsHide &&
            winData.opts.headerActions
          ) {
            const iconTitle = xpopupApi.t("Label__Actions", null, winData);

            headerActions = "<div class='b-xpopup__header-actions'>";
            headerActions +=
              "<div class='b-xpopup__header-actions-toggler' role='button'><span class='b-xpopup-ico b-xpopup-ico_actions'></span><span class='b-xpopup__header-actions-toggler-text'>" +
              iconTitle +
              "</span></div>";
            headerActions += "<ul class='b-xpopup__header-actions-items'>";

            winData.opts.headerActions.forEach(function (action, index) {
              action.type = action.type || "link";
              if (action.type == "separator") {
                headerActions +=
                  "<li class='b-xpopup__header-actions-divider' role='separator' />";
              } else if (action.type == "header") {
                headerActions +=
                  "<li class='b-xpopup__header-actions-header'>" +
                  action.title +
                  "</li>";
              } else {
                action.attributes = action.attributes || {};
                action.attributes.class = action.attributes.class || "";
                action.attributes.class =
                  "b-xpopup__header-action-link " + action.attributes.class;

                let icon = "";
                if (action.iconClass) {
                  icon = "<i class='" + action.iconClass + "' ></i> ";
                }
                let hint = "";
                if (action.hint) {
                  hint =
                    "<span class='b-xpopup-ico b-xpopup-ico_question __hint-icon' title='" +
                    action.hint +
                    "' ></span>";
                }
                if (icon || hint) {
                  action.attributes.class += " _has-icons";
                }

                let attrs = "";
                Object.keys(action.attributes).forEach((key) => {
                  attrs += " " + key + "='" + action.attributes[key] + "' ";
                });

                headerActions += "<li class='b-xpopup__header-action'>";
                headerActions += "<a href='" + action.url + "' " + attrs;
                headerActions += " >";
                headerActions += icon + action.title + hint;
                headerActions += "</a>";
                headerActions += "</li>";
              }
            });
            headerActions += "</ul>";
            headerActions += "</div>";
            headerClasses += " b-xpopup__header_has-actions";
          }

          const $header = $(
            "<div class='" +
              headerClasses +
              "'>" +
              headerBack +
              headerIcon +
              headerCaption +
              headerActions +
              "</div>",
          ).prependTo($headerContainer);
          if (!calcMode) {
            $header
              .find(".b-xpopup__header-actions-toggler")
              .on("click", function () {
                $(this).next(".b-xpopup__header-actions-items").toggle();
              });
            el.$header = $header;
          }
          hasHeader = true;
        }
      }

      // ===================================================================
      // СОЗДАНИЕ КНОПКИ ЗАКРЫТИЯ
      // Логика выбора режима:
      // - 'none'         — кнопка не отображается
      // - 'inside'       — внутри контейнера (шапки или контента)
      // - 'outside'      — снаружи контейнера, рядом с верхним правым углом
      // - 'screen'       — фиксированно в углу экрана (для image/screen режимов)
      // - 'auto'         — автоматический выбор:
      //      - есть header → inside
      //      - screen-режим или image → screen
      //      - иначе → outside
      // ===================================================================
      if (!calcMode) {
        if (el.$closeBtn) {
          el.$closeBtn.remove();
        }

        let closeBtnType = null;
        if (winData.opts.closeBtnType != "none") {
          closeBtnType = winData.opts.closeBtnType;

          // Автоматический выбор режима
          if (closeBtnType == "auto") {
            if (hasHeader) {
              // Есть шапка — кнопка внутри неё
              closeBtnType = "inside";
            } else if (
              winData.opts.sizeMode == "screen" ||
              winData.opts.type == "image"
            ) {
              // Полноэкранный режим — фиксированная кнопка
              closeBtnType = "screen";
            } else {
              // Маленькое окно без шапки — снаружи контейнера
              closeBtnType = "outside";
            }
          }
        }

        // Создаём кнопку в зависимости от режима
        switch (closeBtnType) {
          case "inside":
            // Внутри контейнера (шапки или контента)
            el.$closeBtn = $(
              '<span type="button" class="b-xpopup__close b-xpopup__close_type_inside"><span class="b-xpopup-ico b-xpopup-ico_close"></span></span>',
            );
            if (hasHeader) {
              el.$closeBtn.appendTo($headerContainer);
            } else {
              el.$closeBtn.appendTo(el.$contentContainer);
            }
            break;

          case "outside":
            // Снаружи контейнера, рядом с верхним правым углом
            // Крепим к $box, чтобы overflow:hidden на контейнере не обрезал кнопку
            // Позиционирование задаётся через CSS-переменные, которые обновляются при ресайзе
            el.$closeBtn = $(
              '<span type="button" class="b-xpopup__close b-xpopup__close_type_outside"><span class="b-xpopup-ico b-xpopup-ico_close"></span></span>',
            );
            el.$closeBtn.appendTo(el.$box);
            break;

          case "screen":
            // Фиксированная кнопка в углу экрана (для image и полноэкранных)
            el.$closeBtn = $(
              '<span type="button" class="b-xpopup__close b-xpopup__close_type_screen"><span class="b-xpopup-ico b-xpopup-ico_close"></span></span>',
            );
            el.$closeBtn.appendTo(el.$box);
            break;

          // case 'none' — кнопка не создаётся
        }
      }

      return hasHeader;
    }

    _buildFooter(appendTo) {
      const st = this.getStorage();
      const winData = st.getCurrentWindow();
      const el = st.getElements();

      if (winData.opts.footerActions && !winData.opts.footerHide) {
        const $footer = $("<div>").addClass("b-xpopup__footer");

        // Добавляем кастомные классы футера, если переданы
        if (typeof winData.opts.footerClasses === "string") {
          $footer.addClass(winData.opts.footerClasses);
        }

        // Группируем кнопки по позициям
        const groups = {
          left: [], // кнопки слева
          center: [], // кнопки по центру
          right: [], // кнопки справа (по умолчанию)
        };

        // Распределяем кнопки по группам
        winData.opts.footerActions.forEach(function (item) {
          const position = item.position || "right"; // по умолчанию right
          if (!groups[position]) {
            groups[position] = [];
          }
          groups[position].push(item);
        });

        // Создаём контейнеры для каждой группы
        const positions = ["left", "center", "right"];

        positions.forEach(function (position) {
          const items = groups[position];
          if (!items || items.length === 0) return;

          // Создаём обёртку группы
          const $group = $("<div>").addClass("b-xpopup__footer-group");

          // Добавляем класс позиционирования
          $group.addClass("b-xpopup__footer-group_" + position);

          // Создаём кнопки внутри группы
          items.forEach(function (item) {
            const $action = $("<a>");
            $action.addClass("b-xpopup__footer-action");

            // Обработка xtype: 'close' — создаём кнопку закрытия
            if (typeof item.xtype === "string") {
              if (item.xtype == "close") {
                item.href = "javascript:void(0);";
                $action.addClass("b-xpopup-action b-xpopup-action_type_close");
                if (!item.text) {
                  const iconTitle = xpopupApi.t("Label__Close", null, winData);

                  item.text = iconTitle;
                }
                if (!item.classes) {
                  $action.addClass("btn btn-default");
                }
              }
            }

            // Применяем CSS-классы
            if (typeof item.classes === "string") {
              $action.addClass(item.classes);
            }

            // Применяем href
            if (typeof item.href === "string") {
              $action.attr("href", item.href);
            }

            // Применяем текст
            if (typeof item.text === "string") {
              $action.text(item.text);
            }

            // Применяем data-атрибуты
            if (Array.isArray(item.attrs)) {
              item.attrs.forEach(function (attr) {
                $action.attr(attr.name, attr.value);
              });
            }

            $group.append($action);
          });

          $footer.append($group);
        });

        $footer.appendTo(appendTo);
        el.$footer = $footer;

        return true;
      }
      return false;
    }

    _updateArrow(type) {
      const st = this.getStorage();
      const winData = st.getCurrentWindow();
      const el = st.getElements();

      let $arrow = null;
      let arrowData = null;
      let $arrowTrigger = null;

      //Сформируем стрелку
      if (winData.opts[type + "ArrowData"]) {
        arrowData = winData.opts[type + "ArrowData"];
      } else if (winData.opts[type + "ArrowUrl"]) {
        arrowData = arrowData || {};
        arrowData["content"] = winData.opts[type + "ArrowUrl"];
      } else if (winData.opts[type + "ArrowTrigger"]) {
        $arrowTrigger = $(winData.opts[type + "ArrowTrigger"]);
      }
      // поддержка карусели (galleryLoop) для галереи
      else if (type == "left") {
        const galleryItemsCount = winData.galleryItemsCount;
        const currentIndex = winData.galleryItemIndex;
        const isLoop = winData.opts.galleryLoop !== false; // по умолчанию true

        if (galleryItemsCount > 1) {
          if (currentIndex > 0) {
            // Есть предыдущий элемент
            $arrowTrigger = $(
              ".b-xpopup-gallery_id_" +
                winData.galleryId +
                ".b-xpopup-gallery__item-" +
                (currentIndex - 1),
            );
          } else if (isLoop && currentIndex === 0) {
            // Карусель: с первого на последний
            $arrowTrigger = $(
              ".b-xpopup-gallery_id_" +
                winData.galleryId +
                ".b-xpopup-gallery__item-" +
                (galleryItemsCount - 1),
            );
          }
        }
      } else if (type == "right") {
        const galleryItemsCount = winData.galleryItemsCount;
        const currentIndex = winData.galleryItemIndex;
        const isLoop = winData.opts.galleryLoop !== false; // по умолчанию true

        if (galleryItemsCount > 1) {
          if (currentIndex < galleryItemsCount - 1) {
            // Есть следующий элемент
            $arrowTrigger = $(
              ".b-xpopup-gallery_id_" +
                winData.galleryId +
                ".b-xpopup-gallery__item-" +
                (currentIndex + 1),
            );
          } else if (isLoop && currentIndex === galleryItemsCount - 1) {
            // Карусель: с последнего на первый
            $arrowTrigger = $(
              ".b-xpopup-gallery_id_" +
                winData.galleryId +
                ".b-xpopup-gallery__item-0",
            );
          }
        }
      }

      if (arrowData || $arrowTrigger) {
        if (winData.opts[type + "ArrowTitle"]) {
          arrowData = arrowData || {};
          arrowData.headerCaption = winData.opts[type + "ArrowTitle"];
        }

        const arrowClasses =
          "b-xpopup__arrow b-xpopup__arrow_" +
          type +
          "  b-xpopup-option_close_off";
        const iconClass =
          type === "left"
            ? "b-xpopup-ico_arrow-left"
            : "b-xpopup-ico_arrow-right";
        $arrow = $(
          "<span class='" +
            arrowClasses +
            "' >" +
            "<span class='b-xpopup__arrow-icon'>" +
            "<span class='b-xpopup-ico " +
            iconClass +
            "'></span>" +
            "</span>" +
            "</span>",
        );
        const arrowTitle = $arrowTrigger ? $arrowTrigger.attr("title") : null;
        if (arrowTitle) {
          $arrow.find(".b-xpopup__arrow-icon").attr("title", arrowTitle);
        }

        //начало листания (и анимации смены кадров)
        $arrow.click(function () {
          arrowData = arrowData || {};

          // ===================================================================
          // Нужно, чтобы при открытии следующего кадра галереи новый winData наследовал
          // все пользовательские опции от текущего окна галереи.
          // Самый чистый способ — сделать это в _updateArrow() один раз, пробросив все значимые опции текущего окна в arrowData.
          //
          // Наследование опций от текущего окна галереи
          // При листании галереи создаётся новый вызов $.xpopup.open(),
          // который формирует новый winData с нуля. Чтобы пользовательские
          // настройки (skin, galleryLoop, boxAnimation, closeBtnType и др.)
          // не терялись, пробрасываем все значимые опции текущего окна.
          // ===================================================================
          const inheritOpts = [
            "skin",
            "skinMod",
            "boxAnimation",
            "boxAnimationOpen",
            "boxAnimationClose",
            "bgAnimation",
            "closeBtnType",
            "closeOnBgClick",
            "closeOnEsc",
            "galleryLoop",
            "imageShareAction",
            "imageDownloadAction",
            "modal",
            "preloader",
            "bodyScrollable",
            "responsive",
          ];

          inheritOpts.forEach(function (key) {
            if (
              winData.opts[key] !== undefined &&
              arrowData[key] === undefined
            ) {
              arrowData[key] = winData.opts[key];
            }
          });

          arrowData.clickedArrow = type;

          // Без анимации — просто открываем новое изображение
          $.xpopup.open(arrowData, $arrowTrigger);
        });

        // подсветка активной стрелки (последнее направление листания)
        // Если это направление совпадает с последним кликом — делаем стрелку ярче
        const lastClickedArrow = winData.opts.clickedArrow;
        if (lastClickedArrow === type) {
          $arrow.addClass("b-xpopup__arrow_active");
        }
      }

      //Обновим стрелку и её контейнер
      const $type = "$" + type;
      if (el[$type + "Arrow"]) {
        el[$type + "Arrow"].remove();
      }

      if ($arrow) {
        el[$type + "Arrow"] = $arrow;
        // ВАЖНО: для типа image стрелки вставляются в $box,
        // чтобы не анимироваться вместе с контентом при смене кадров.
        // Для остальных типов — как раньше, в $container.
        // if (winData.opts.type === "image") {
        //   el.$box.append(el[$type + "Arrow"]);
        // } else if (el.$container) {
        //   el.$container.append(el[$type + "Arrow"]);
        // }
        //теперь так:
        el.$box.append(el[$type + "Arrow"]);
      }
    }

    _updateContainerSizes() {
      const win = this;
      const st = this.getStorage();
      const winData = st.getCurrentWindow();
      const el = st.getElements();

      if (!el.$container || !winData) {
        // Если $container пустой, значит _updateContainerSizes() был вызван при закрытии бокса.
        // В этом случае никаких пересчетов делать не нужно.
        return;
      }

      // ===================================================================
      // ВЫЧИСЛЕНИЕ БАЗОВЫХ РАЗМЕРОВ
      // ===================================================================

      // Учтём верт. отступы xpopup-окна, если они были заданы в стилях xpopup
      const vertMargins =
        parseInt(el.$box.css("padding-top")) +
        parseInt(el.$box.css("padding-bottom"));
      const winWidth = window.innerWidth;
      const winHeight = window.innerHeight - vertMargins;

      const css = {};

      // Сбросим размеры/стили окна
      el.$container.attr("style", "");

      // ===================================================================
      // ПРИМЕНЕНИЕ ЗАДАННЫХ РАЗМЕРОВ
      // ===================================================================

      if (winData.opts.minWidth) {
        css.minWidth = _parseWidth(winData.opts.minWidth, winWidth);
        if (css.minWidth > winWidth) {
          css.minWidth = winWidth;
        }
      }
      if (winData.opts.width) {
        css.width = _parseWidth(winData.opts.width, winWidth);
        if (css.width > winWidth) {
          css.width = winWidth;
        }
      }
      if (winData.opts.maxWidth) {
        css.maxWidth = _parseWidth(winData.opts.maxWidth, winWidth);
      }

      if (winData.opts.minHeight) {
        css.minHeight = _parseHeight(winData.opts.minHeight, winHeight);
      }
      if (winData.opts.height) {
        css.height = _parseHeight(winData.opts.height, winHeight);
      }
      if (winData.opts.maxHeight) {
        css.maxHeight = _parseHeight(winData.opts.maxHeight, winHeight);
      }

      // ===================================================================
      // УСЛОВНАЯ УСТАНОВКА РАЗМЕРОВ ОКНА
      // 1) Если заданы maxHeight, height — используем их
      // 2) Если sizeMode == 'screen' — height = winHeight (на весь экран)
      // 3) Если sizeMode == 'auto' — вычисляем оптимальные размеры (с кэшированием)
      // ===================================================================
      if (winData.opts.sizeMode == "auto") {
        // // Если установлен режим responsive и используется смартфон,
        // // то установим мин высоту окна в winHeight.
        // if (winData.opts.responsive && xpopupUtils.isPhone()) {
        //   el.$box.addClass("b-xpopup_responsive");
        //   css.minHeight = winHeight;
        // } else {
        //   el.$box.removeClass("b-xpopup_responsive");
        // }

        if (css.maxWidth && css.maxWidth > winWidth) {
          css.maxWidth = winWidth;
        }

        // Определяем, фиксирован ли размер окна.
        const hasExplicitHeight = winData.opts.height || winData.opts.minHeight;
        const hasExplicitWidth = winData.opts.width || winData.opts.maxWidth;
        const sizeModeFixed = winData.opts.sizeMode !== "auto";
        winData._isFixedSize =
          sizeModeFixed || (hasExplicitHeight && hasExplicitWidth);

        // Нужно ли вычислять размеры контента через клонирование DOM
        const needCalcSize =
          !sizeModeFixed && !css.maxWidth && !hasExplicitWidth;

        if (needCalcSize) {
          let contentSize = winData._cachedContentSize;

          // ===================================================================
          // Сбрасываем кэш, если он больше текущей ширины окна.
          // Это предотвращает скачки ширины при ресайзе браузера:
          // кэшированный размер, вычисленный для более широкого экрана,
          // не должен применяться на узком (и наоборот).
          // ===================================================================
          if (contentSize && contentSize.width >= winWidth) {
            winData._cachedContentSize = null;
            contentSize = null;
          }

          if (!contentSize) {
            contentSize = win._calcContentSize(css);
            const hasContentSize =
              contentSize && Object.keys(contentSize).length > 0;

            if (hasContentSize) {
              // Кэшируем только если размер меньше ширины окна
              if (contentSize.width < winWidth) {
                winData._cachedContentSize = contentSize;
              }
              css.maxWidth = contentSize.width;
            }
          } else {
            css.maxWidth = contentSize.width;
          }

          // Если автоматически полученный css.maxWidth равен ширине окна,
          // принудительно уменьшаем для удобства восприятия
          if (css.maxWidth == winWidth) {
            if (css.maxWidth >= 768 && css.maxWidth < 1024) {
              css.maxWidth = winWidth * 0.85;
            } else if (css.maxWidth > 1024) {
              css.maxWidth = winWidth * 0.75;
            }
          }
        }

        // Применим новые размеры
        if (Object.keys(css).length > 0) {
          el.$container.css(css);
        }

        // Вертикальное центрирование
        const maxH = el.$container.outerHeight();
        if (maxH && maxH < winHeight) {
          const top = (winHeight - maxH) / 2;
          el.$container.css({ top: top });
        }

        // Если установлен режим responsive и используется смартфон,
        // то установим мин высоту окна в winHeight.
        if (
          winData.opts.responsive &&
          xpopupUtils.isPhone() &&
          maxH > winHeight * 0.87
        ) {
          el.$box.addClass("b-xpopup_responsive");
          css.minHeight = winHeight;
          el.$container.css(css);

          let contentHeight = winHeight;
          if (el.$header) {
            contentHeight -= el.$header.outerHeight();
          }
          if (el.$footer) {
            contentHeight -= el.$footer.outerHeight();
          }
          el.$contentContainer.css("min-height", contentHeight);
        } else {
          el.$box.removeClass("b-xpopup_responsive");
        }
        // Responsive-режим на смартфоне
        // if (winData.opts.responsive && xpopupUtils.isPhone()) {
        //   let contentHeight = winHeight;

        //   if (el.$header) {
        //     contentHeight -= el.$header.outerHeight();
        //   }

        //   if (el.$footer) {
        //     contentHeight -= el.$footer.outerHeight();
        //   }

        //   el.$contentContainer.css("min-height", contentHeight);
        //   el.$box.addClass("b-xpopup_responsive");
        // } else {
        //   el.$box.removeClass("b-xpopup_responsive");
        // }
      } else if (winData.opts.sizeMode == "screen") {
        // Если установлен режим responsive и используется смартфон,
        // то установим мин высоту окна в winHeight.
        // if (winData.opts.responsive && xpopupUtils.isPhone()) {
        //   el.$box.addClass("b-xpopup_responsive");
        //   css.minHeight = winHeight;
        // } else {
        //   el.$box.removeClass("b-xpopup_responsive");
        // }

        // Если установлен режим responsive и используется смартфон,
        // то установим мин высоту окна в winHeight.
        if (
          winData.opts.responsive &&
          xpopupUtils.isPhone() 
        ) {
          el.$box.addClass("b-xpopup_responsive");
          css.minHeight = winHeight;
          el.$container.css(css);

          let contentHeight = winHeight;
          if (el.$header) {
            contentHeight -= el.$header.outerHeight();
          }
          if (el.$footer) {
            contentHeight -= el.$footer.outerHeight();
          }
          el.$contentContainer.css("min-height", contentHeight);
        } else {
          el.$box.removeClass("b-xpopup_responsive");
        }

        // Режим "на весь экран" — размеры фиксированы
        css.height = css.minHeight = css.maxHeight = winHeight;
        css.width = css.minWidth = css.maxWidth = winWidth;
        css.overflow = "hidden";

        if (Object.keys(css).length > 0) {
          el.$container.css(css);
        }
      } else {
        /* strict mode */
        // Режим strict — размеры заданы явно
        if (Object.keys(css).length > 0) {
          el.$container.css(css);
        }

        // Вертикальное центрирование для strict-режима
        const maxH = el.$container.outerHeight();
        if (maxH && maxH < winHeight) {
          const top = (winHeight - maxH) / 2;
          el.$container.css({ top: top });
        }
      }

      // ===================================================================
      // SIZE-HOLDER: применяем размеры попапа к элементу-держателю
      // ===================================================================
      const $sizeHolder = el.$container.find(".b-xpopup__size-holder");
      if ($sizeHolder.size() > 0) {
        $sizeHolder.css({
          width: el.$container.width(),
          height:
            el.$container.height() - (el.$header ? el.$header.height() : 0),
        });
      }

      // ===================================================================
      // УПРАВЛЕНИЕ ОТСТУПАМИ $box
      //
      // Убираем padding у $box в следующих случаях:
      // 1) sizeMode == 'screen' — окно на весь экран
      // 2) Высота контейнера >= высота viewport'а
      // 3) Ширина контейнера >= ширина viewport'а
      //
      // Это предотвращает появление ненужных отступов вокруг полноэкранных
      // окон и улучшает использование пространства на мобильных устройствах.
      // В обычных маленьких окнах отступы сохраняются для эстетики.
      // ===================================================================
      // const containerOuterHeight = el.$container.outerHeight();
      // const containerOuterWidth = el.$container.outerWidth();

      // const isFullHeight = containerOuterHeight >= winHeight;
      // const isFullWidth = containerOuterWidth >= winWidth;
      // const isScreenMode =
      //     winData.opts.sizeMode === 'screen' ||
      //     (isFullHeight && isFullWidth && winData.opts.maxSize === 'screen');

      // Вертикальные отступы
      // if (isFullHeight) {
      //     el.$box.addClass('b-xpopup_fullheight_true');
      //     el.$box.css({
      //         paddingTop: 0,
      //         paddingBottom: 0,
      //     });
      // } else {
      //     // Сбрасываем inline-стили, возвращая CSS-правила из скинов
      //     el.$box.removeClass('b-xpopup_fullheight_true');
      //     el.$box.css({
      //         paddingTop: '',
      //         paddingBottom: '',
      //     });
      // }

      // ===================================================================
      // УПРАВЛЕНИЕ СКРОЛЛОМ БОКСА
      // Если высота попапа <= высоты окна — скрываем скролл
      // Если больше — показываем вертикальную полосу прокрутки
      // ===================================================================
      if (el.$container.height() <= winHeight) {
        el.$box.css({
          overflowX: "hidden",
          overflowY: "hidden",
        });
      } else {
        el.$box.css({
          overflowX: "hidden",
          overflowY: "auto",
        });
      }

      // ===================================================================
      // CSS-ПЕРЕМЕННЫЕ БОКСА
      // Обновляем переменные для использования в CSS-стилях содержимого
      // ===================================================================
      const boxEl = el.$box.get(0);
      const boxHeight = boxEl.style.getPropertyValue("--xpopup-box-height");
      if (!boxHeight || boxHeight != el.$container.outerHeight() + "px") {
        boxEl.style.setProperty(
          "--xpopup-window-height",
          el.$container.outerHeight() + "px",
        );
        boxEl.style.setProperty(
          "--xpopup-window-header-height",
          el.$headerContainer.outerHeight() + "px",
        );
      }

      // ===================================================================
      // ОБНОВЛЕНИЕ ПОЗИЦИИ OUTSIDE-КНОПКИ ЗАКРЫТИЯ
      //
      // Алгоритм адаптивного позиционирования...
      // ===================================================================
      if (
        el.$closeBtn &&
        el.$closeBtn.hasClass("b-xpopup__close_type_outside")
      ) {
        const MARGIN = 15;

        const containerRect = el.$container[0].getBoundingClientRect();
        const boxRect = el.$box[0].getBoundingClientRect();

        const spaceTop = containerRect.top;
        const spaceRight = winWidth - containerRect.right;

        const btnHalfSize = 15;
        const btnSize = 30;

        const canPlaceOutsideX = spaceRight >= btnHalfSize;
        const canPlaceOutsideY = spaceTop >= btnHalfSize;

        const containerRightRelBox = containerRect.right - boxRect.left;
        const containerTopRelBox = containerRect.top - boxRect.top;

        const outX = containerRightRelBox + MARGIN;
        const outY = containerTopRelBox - MARGIN;

        const inX = containerRightRelBox - btnSize - MARGIN;
        const inY = containerTopRelBox + MARGIN;

        let posX, posY;
        let needTransformX = false;
        let needTransformY = false;
        let insideX = false;
        let insideY = false;

        if (canPlaceOutsideX) {
          posX = outX;
          needTransformX = true;
          insideX = false;
        } else {
          posX = inX;
          needTransformX = false;
          insideX = true;
        }

        if (canPlaceOutsideY) {
          posY = outY;
          needTransformY = true;
          insideY = false;
        } else {
          posY = inY;
          needTransformY = false;
          insideY = true;
        }

        // Класс _inside-corner: только если обе координаты внутри
        if (insideX && insideY) {
          el.$closeBtn.addClass("_inside-corner");
        } else {
          el.$closeBtn.removeClass("_inside-corner");
        }

        // Transform
        let transformValue = "";
        if (needTransformX && needTransformY) {
          transformValue = "translate(-50%, -50%)";
        } else if (needTransformX && !needTransformY) {
          transformValue = "translate(-50%, 0)";
        } else if (!needTransformX && needTransformY) {
          transformValue = "translate(0, -50%)";
        } else {
          transformValue = "none";
        }
        el.$closeBtn.css("transform", transformValue);

        el.$closeBtn[0].style.setProperty(
          "--xpopup__close_outside_top",
          posY + "px",
        );
        el.$closeBtn[0].style.setProperty(
          "--xpopup__close_outside_left",
          posX + "px",
        );
      }
    }

    /**
     * Высчитывает реальные размер окна с содержимым content с учётом текущего скина
     * @param  {[type]} obj [description]
     * @return {[type]}     [description]
     */
    _calcContentSize(css) {
      const st = this.getStorage();
      const el = st.getElements();

      if (!el.$content) {
        return {};
      }

      const $boxClone = el.$box.clone().css({
        visibility: "hidden",
      });
      const $container = $boxClone.find(".b-xpopup__content-container");
      const $sizeEl = $container.find(".b-xpopup-size").first();

      //Применим новые размеры к окну, если они были заданы
      // замена $.isEmptyObject на проверку количества ключей
      if (Object.keys(css).length > 0) {
        $container.css(css);
      }

      if ($sizeEl.size() > 0) {
        //Когда есть класс 'b-xpopup-size', для автоматического вычисления размера блока
        //необходимо установить float:left. В этом случае нормально отработает выражение вида: style='max-width: 730px; width: 100%;'
        //ВАЖНО: не рекомендуется использовать данный подход и класс b-xpopup-size. Вместо этого лучше исопльзовать b-xpopup-data-container и data-аттрибуты
        $boxClone.css({
          float: "left",
        });

        const sizeEl = $sizeEl.get(0);
        const containerEl = $container.get(0);

        //Наст интересует только значеие sizeEl.style.maxWidth
        if (sizeEl.style.maxWidth && !containerEl.style.width) {
          //Сбросим стиль контейнера (чтобы при смене контента в окне старые установки размеров окна не применялись)
          // $container.attr('style', ''); //должно уже быть сброшено где-то выше, поэтому лишнее
          //Установим containerEl.style.width в sizeEl.style.maxWidth, чтобы выполнить подсчет оптимальных размеров окна
          // containerEl.style.width = sizeEl.style.maxWidth;
          containerEl.style.maxWidth = sizeEl.style.maxWidth;
        }

        const winWidth = $window.width();
        //containerEl.style.width будет в виде 120px, поэтому нужно сделать parsetInt()
        if (parseInt(containerEl.style.width) > winWidth) {
          //Ширина окна не должна быть больше winWidth
          // containerEl.style.width = winWidth;
          containerEl.style.maxWidth = winWidth;
        }
      } else {
        $boxClone.css({
          display: "inline-flex",
        });
      }

      $boxClone.appendTo("body");

      const dim = {
        width: $container.outerWidth(),
        height: $container.height(),
      };

      $boxClone.remove();

      return dim;
    }
  } /* XpopupWindowCtrl end */

  $.xpopup.registerPlugin("window_ctrl", new XpopupWindowCtrl());

  /// Utilities ///

  /**
   * Формирует объект настроек, переданных для текущего окна в элементе окна .b-xpopup-data-container
   *
   * @param  {[type]} windowOptions      [description]
   *   Содержит опции текущего экрана
   * @return {[type]}
   *   Объект настроек
   */
  function _extractContentOptions(winData) {
    let contentOptions = null;

    const content = winData.opts.html;

    if (content) {
      //Контент может прийти в разном виде. Попробуем найти в нём элемент, который может содержать data-аттрибуты с настройками окна.
      //Такой элемент всегд имеет класс b-xpopup-data-container. Он может быть как корневым элементом, так и дочерним.
      const $content = $(content);
      let $dataContainer = $content.filter(".b-xpopup-data-container").first();
      if ($dataContainer.size() == 0) {
        $dataContainer = $content.find(".b-xpopup-data-container").first();
      }
      if ($dataContainer.size() > 0) {
        contentOptions = _extractDataOptions($dataContainer);
      }

      const headerActionsSelector =
        winData.opts.headerActionsSelector ||
        (contentOptions && contentOptions.headerActionsSelector);
      //Если передан селектор для поиска действий, отображаемых в шапке, то попробуем найти такие ссылки
      if (headerActionsSelector) {
        const $actionsLinks = $content.find(headerActionsSelector);
        const actions = [];
        $actionsLinks.each(function () {
          const $actionLink = $(this);
          const href = $actionLink.attr("href");
          if (!href) {
            return;
          }
          const title = $actionLink.attr("title") || $actionLink.html();
          const action = {
            url: href,
            title: title,
            data: $actionLink.data(),
            classes: $actionLink.attr("class"),
          };
          actions.push(action);
        });
        if (actions.length > 0) {
          contentOptions = contentOptions || {};
          contentOptions.headerActions = actions;
        }
      }
    }

    return contentOptions;
  }

  /**
   * Формирует объект настроек, переданных для текущего окна в виде дата-аттрибутов.
   *
   * замена $.type на typeof
   *
   * @param  {[type]} el      [description]
   *   Содержит элемент, в котором нужно поискать дата-аттрибуты для окна
   * @return {[type]}
   *   Объект настроек, переданных в виде дата-аттрибутов el
   */
  function _extractDataOptions(el, elType) {
    // замена $.type на typeof
    if (typeof el !== "object" || el === null) {
      return null;
    }
    const $el = $(el);
    const data = $el.data();
    // замена $.isEmptyObject на проверку количества ключей
    if (Object.keys(data).length === 0) {
      return null;
    }

    const pluginData = _extractPluginDataOptions(data, "xpopup");
    return pluginData;
  }

  /**
   * Формирует объект настроек, переданных для текущего плагина в виде дата-аттрибутов.
   * Такие дата-аттрибуты имеют в названии префикс prefixToDelete (например, data-xpopup-width).
   *
   * Результирующий объект настроек включает в себя только те свойства, называния которых нач-ся с prefixToDelete.
   * При этом из названий свойств результирующего объекта удаляется префикс.
   * Также свойства со стоковыми значениями 'true', 'false' преобразуются в соотв. значение Boolean.
   *
   * Пример:
   *
   * ```javascript
   * const origData = {xpopupWidth:600,xpopupHeight:'800', xpopupHeaderCaption:'Это пример', xpopupAnimation:'true', someOtherProp:'test',};
   * const resData = _extractPluginDataOptions = function(origData, 'xpopup');
   * //resData -> {width:600, height:'800', animation: true, headerCaption:'Это пример'}
   * ```
   *
   * замена $.isEmptyObject на проверку количества ключей
   *
   * @param  {[object]} dataObject
   * @return {[object]}
   */
  function _extractPluginDataOptions(dataObject, prefixToDelete) {
    // замена $.isEmptyObject на проверку количества ключей
    if (Object.keys(dataObject).length === 0) {
      return {};
    }

    const o = {};
    const prefixLength = prefixToDelete.length;

    //Обработаем опции из дата аттрибутов
    Object.keys(dataObject).forEach((key) => {
      const value = dataObject[key];

      //Проверим, начинается ли название свойства с префикса prefixToDelete
      const prefix = key.slice(0, prefixLength);
      if (prefix != prefixToDelete) {
        return;
      }

      let propName = key.slice(prefixLength); //remove xpopup prefix
      propName = propName.charAt(0).toLowerCase() + propName.slice(1); //decapitalize prop name

      if (value == "true" || value == "false") {
        o[propName] = new Boolean(value).valueOf();
      } else {
        o[propName] = value;
      }
    });

    return o;
  }

  /**
   * Парсит числовое значение ширины элемента из value.
   * Если value имеет вид <число>%, то высчитывает значение относительно ширины окна.
   *
   * замена $.isNumeric на проверку typeof + isNaN
   */
  function _parseWidth(value, winWidth) {
    if (typeof value === "undefined") return value;
    if (typeof value === "number") return value; // уже число — не парсим

    if (typeof value === "string" && value.endsWith("%")) {
      return (parseInt(value) / 100) * winWidth;
    }
    return parseInt(value);
  }

  /**
   * Парсит числовое значение высотоы элемента из value.
   * Если value имеет вид <число>%, то высчитывает значение относительно высоты окна.
   *
   * замена $.isNumeric на проверку typeof + isNaN
   */
  function _parseHeight(value, winHeight) {
    if (typeof value === "undefined") return value;
    if (typeof value === "number") return value; // уже число — не парсим

    if (typeof value === "string" && value.endsWith("%")) {
      return (parseInt(value) / 100) * winHeight;
    }
    return parseInt(value);
  }
})(jQuery);
