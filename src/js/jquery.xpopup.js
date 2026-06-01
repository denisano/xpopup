(function ($) {
  /**
   * Public static functions
   */
  const xpopupApi = ($.xpopup = new (class XpopupApi {
    /**
     * Public constants
     */
    constructor() {
      this.EVENT_NS = ".xpopup";
      // EVENT_BOX_ANIMATION_BEFORE : 'xpopup_box_animation_before',  //Перед тем как бокс откроется (первый раз)
      // EVENT_BOX_ANIMATION_AFTER : 'xpopup_box_animation_after',  //Перед тем как бокс откроется (первый раз)
      this.EVENT_BOX_NEW_STATUS = "xpopup_box_new_status"; //Перед тем как бокс откроется (первый раз)
      this.EVENT_BOX_OPEN_BEFORE = "xpopup_box_open_before"; //Перед тем как бокс откроется (первый раз)
      this.EVENT_BOX_OPEN_AFTER = "xpopup_box_open_after"; //После того как бокс открыт
      this.EVENT_BOX_CLOSE_BEFORE = "xpopup_box_close_before"; //Перед тем как бокс закроется
      this.EVENT_BOX_CLOSING = "xpopup_box_closing"; //Перед тем как бокс закроется
      this.EVENT_BOX_CLOSE_AFTER = "xpopup_box_close_after"; //После того как бокс закрыт
      this.EVENT_BOX_CLOSED = "xpopup_box_closed"; //После того как бокс закрыт
      this.EVENT_POPUP_CLOSED = "xpopup_popup_closed"; //После того как все боксы были закрыты
      this.EVENT_WINDOW_SETTINGS_ALTER = "xpopup_window_settings_alter";
      this.EVENT_WINDOW_CHANGE_BEFORE = "xpopup_window_change_before"; //Перед тем как размре бокса будут изменен
      this.EVENT_WINDOW_NEW_STATUS = "xpopup_window_new_status"; //Перед тем как размре бокса будут изменен
      this.EVENT_WINDOW_RENDER_CONTENT_BEFORE =
        "xpopup_window_render_content_before"; //Перед тем как размре бокса будут изменен
      this.EVENT_WINDOW_DISPOSE_BEFORE = "xpopup_window_dispose_before"; //Перед тем как размре бокса будут изменен
      this.EVENT_WINDOW_DISPOSE_AFTER = "xpopup_window_dispose_after"; //Перед тем как размре бокса будут изменен
      this.EVENT_WINDOW_CHANGE_AFTER = "xpopup_window_change_after"; //Перед тем как размре бокса будут изменен
      this.EVENT_WINDOW_LOADING = "xpopup_window_loading"; //После того как новый контент добавлен в бокс
      this.EVENT_WINDOW_READY = "xpopup_window_ready"; //После того как новый контент добавлен в бокс
      this.EVENT_WINDOW_AJAX_SUCCESS = "xpopup_window_ajax_success"; //После того как новый контент добавлен в бокс
      this.EVENT_WINDOW_AJAX_REQUEST_BEFORE =
        "xpopup_window_ajax_request_before"; //После того как новый контент добавлен в бокс

      this.CLASS_BOX = "b-xpopup";
      this.CLASS_LOADING = "b-xpopup_status_loading";
      this.CLASS_READY = "b-xpopup_status_ready";

      this.defaults = {
        debug: false, // установить true для отладки
        lang: "ru", // Язык интерфейса: 'ru', 'en'
        skin: "default",
        skinMod: "",
        darkMode: false, // Автоматически переключает скин на тёмную версию
        extraClass: "", //позволяет добавить любые доп.классы
        preloader: true,

        // Настройки загрузки
        // loader — тип внешнего лоадера (при первом открытии попапа):
        //   'default'  — стандартный спиннер (через background-image)
        //   'circle'   — вращающийся круг
        //   'line'     — бегущая полоса
        //   'pulse'    — пульсирующая точка
        //   'none'     — без индикации
        //   'my-class' — произвольный CSS-класс для кастомного лоадера
        //   null       — используется 'default'
        loader: null,

        // loaderIn — тип внутреннего лоадера (при загрузке внутри уже открытого окна).
        //   Формат такой же как у loader.
        //   Если null — используется то же значение, что и loader.
        //   Если 'none' — без индикации при обновлении контента.
        loaderIn: null,

        // loaderPlaceholder — CSS-селектор элемента-заглушки.
        //   Если указан, вместо лоадера показывается содержимое этого элемента.
        //   После загрузки контента заглушка заменяется реальным контентом.
        //   Полезно для создания иллюзии мгновенного открытия (skeleton screen).
        loaderPlaceholder: null,

        // Минимальное время (мс), которое попап проведёт в состоянии loading.
        // Если контент загрузился быстрее, статус ready будет отложен до истечения этого времени.
        // Используется для демонстрации лоадеров и skeleton screens.
        minLoadingTimeout: 0, // null — без задержки, число — задержка в мс

        // Если true, галерея работает как карусель (последнее → первое, первое → последнее)
        galleryLoop: true,

        // 'auto' - показывать если share=true, 'always' - всегда, 'none' - никогда
        imageShareAction: "auto",

        // 'auto' - показывать если downloadUrl задан, 'always' - всегда (фолбэк на content), 'none' - никогда
        imageDownloadAction: "auto",

        // Анимация бокса (контент + обёртка)
        boxAnimation: true,
        boxAnimationOpen: "zoom-in",
        boxAnimationClose: "zoom-out",

        // Анимация фона (подложка)
        // true — плавный fade, false — мгновенно
        bgAnimation: true,

        closeOnContentClick: false,
        closeOnBgClick: true,
        closeBtnType: "auto", //'auto','outside','inside','screen','none'
        closeOnEsc: true,
        modal: false,

        headerCaption: null,
        headerCaptionIsSelector: false, //Если true, то headerCaption сначала будет рассматриваться как css-селектор элемента, из которого будет взято содержимое для заголовка окна
        headerSubcaption: null,
        headerSticked: false, //Если true, то header окна будет залипать при соприкосновении с верхней границей окна
        headerIconClass: null,
        headerIconUrl: null,
        headerIconLink: null,
        headerHide: false, //true (скрыть шапку), false (не скрывать шапку)
        headerActionsSelector: null,
        headerActions: null,
        headerActionsHide: false, //true (скрыть действия в шапке), false (не скрывать действия в шапке)

        canBeParent: true, //если false, то окно не может быть родителем для других окон (и все окна, открытые из этого окна никак не будут с ним сяязаны и не будут иметь parentId)
        backBtn: false,

        footerActions: null,
        footerActionsHide: null,

        sizeMode: "auto", //'auto', 'strict', 'screen'
        responsive: false, //Применяется только, когда sizeMode=='auto' и используется смартфон. Действие: устанавливает min-height окна в winHeight, после этого вычисляет и устанавливает min-height контента.
        height: null,
        minHeight: null,
        maxHeight: null,
        width: null,
        minWidth: null,
        maxWidth: null,

        bodyScrollable: false, //разрешить ли прокрутку контента страницы (содержимое body) при открытом popop-окне

        changeUrl: false, //Если true, то при открытии xpopup-окна будет изменяться URL в адресной строке браузера
        changeUrlHistory: false, //Eсли true, то изменения URL будут сохраняться и отслежаваться через history api.

        //Команды, которые будут выполнятся при закрытии окна.
        //Команды можно передавать 3-мя разными вариантами:
        //Вариант 1 - передаем в виде только название комманды
        //  data-xpopup-events-commands = '{box_closed:"reload"}' // При наступлении события 'box_closed' выполнится команда 'reload'
        //Вариант 2 - передаём объект команды
        //  data-xpopup-events-commands = '{box_closed:{command:"FlashMessage", text: "Goodbye!"}}'
        //Вариант 3 - передаём массив объектов команд
        //  data-xpopup-events-commands = "{box_closed: [{'command':'FlashMessage', 'text':'Перезагрузка...'}, {'command':'reload'}] }"
        eventsCommands: null,

        i18n: {
          ru: {
            Label__Close: "Закрыть",
            Label__Actions: "Действия",
            Label__Back: "Назад",
            Label__Download: "Скачать",
            Label__Share: "Поделиться",
            Label__Previous: "Предыдущий",
            Label__Next: "Следующий",
            Msg__Failed_to_load_Xurl: "Не удалось загрузить: %url",
            Msg__Content_not_found: "Контент не найден",
            Msg__The_image_Xurl_is_not_available:
              "Изображение %url не доступно",
            Msg__The_content_could_not_be_loaded:
              "Контент не может быть загружен",
            Msg__Error: "Ошибка",
            Msg__Incorrect_data_to_open_the_window:
              "Некорректные данные для открытия окна",
          },
          en: {
            Label__Close: "Close",
            Label__Actions: "Actions",
            Label__Back: "Back",
            Label__Download: "Download",
            Label__Share: "Share",
            Label__Previous: "Prev",
            Label__Next: "Next",
            Msg__Failed_to_load_Xurl: "Failed to load: %url",
            Msg__Content_not_found: "Content not found",
            Msg__The_image_Xurl_is_not_available:
              "The image %url is not available",
            Msg__The_content_could_not_be_loaded:
              "The content could not be loaded",
            Msg__Error: "Error",
            Msg__Incorrect_data_to_open_the_window:
              "Incorrect data to open the window",
          },
        },
      };
    }

    /**
     * Translate strings to the current language.
     *
     * Supports three styles of placeholders:
     * - !variable: inserted as-is (raw HTML)
     * - @variable: escaped (safe for HTML)
     * - %variable: escaped and wrapped in <em> for emphasis
     *
     * Примеры:
     *
     * ```javascript
     *  const errMsg = xpopupApi.t(
     *       "Msg__The_image_Xurl_is_not_available",
     *       { url: winData.opts.content },
     *       winData,
     *     );
     *  const labelShare = xpopupApi.t(
     *       "Label__Share",
     *       null,
     *       winData,
     *     );
     *  const labelDownload = xpopupApi.t(
     *       "Label__Download",
     *     );
     * ```
     *
     * @param {key} key
     *   The key of string to translate.
     * @param {object} [args={}]
     *   An associative object of replacements.
     * @param {object} [winData=null]
     *   An associative object with winData.
     * @returns {string}
     *   The translated string.
     */
    t(key, args = null, winData = null) {
      const winDataOpts = winData.opts || this.defaults;
      const langcode = winDataOpts.lang || "ru";

      // Get the dictionary for the language, fallback to Russian
      const dict = winDataOpts.i18n[langcode] || winDataOpts.i18n["ru"] || {};

      // Translate the key of string if a translation exists
      let translated = dict[key] !== undefined ? dict[key] : key;

      // If no args, return as-is
      if (!args || Object.keys(args).length === 0) {
        return translated;
      }

      // Process arguments
      const processedArgs = {};
      Object.keys(args).forEach((key) => {
        const value = args[key];
        switch (key[0]) {
          case "!":
            // Pass-through (raw)
            processedArgs[key] = value;
            break;

          case "@":
            // Escaped only (safe for HTML)
            processedArgs[key] = this.escapeHtml(String(value));
            break;

          case "%":
          default:
            if (key[0] != "%") key = "%" + key;
            // Escaped and wrapped in <em> for emphasis
            processedArgs[key] =
              "<em>" + this.escapeHtml(String(value)) + "</em>";
            break;
        }
      });

      // Replace placeholders
      let result = translated;
      Object.keys(processedArgs).forEach((key) => {
        // Escape special regex characters in the key
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        result = result.replace(
          new RegExp(escapedKey, "g"),
          processedArgs[key],
        );
      });

      return result;
    }

    isDebug() {
      return this.defaults.debug == true;
    }

    /**
     * Escape HTML special characters.
     *
     * @param {string} text
     * @returns {string}
     */
    escapeHtml(text) {
      if (text == null) return "";

      const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      };
      return String(text).replace(/[&<>"']/g, (m) => map[m]);
    }

    /// PLugin system ///

    /**
     * xpopupApi.setGlobalSettings({
     *  'common': {skin: 'lite'}
     * });
     * xpopupApi.setGlobalSettings({
     *  'content_type.image': {skin: 'default'}
     *  'content_type.ajax': {skin: 'vk'}
     * });
     */
    setGlobalSettings(settings) {
      Object.keys(settings).forEach((pluginName) => {
        const pluginSettings = settings[pluginName];
        if (pluginName == "common") {
          this.defaults = {
            ...this.defaults,
            ...pluginSettings,
          };
        } else {
          const plugin = this.pluginGet(pluginName);
          plugin.defaults = {
            ...plugin.defaults,
            ...pluginSettings,
          };
        }
      });
    }

    registerPlugin(name, plugin) {
      const nameParts = name.split(".");
      if (nameParts.length == 2) {
        plugin.pluginType = nameParts[0];
      } else {
        plugin.pluginType = "custom";
      }
      plugin.pluginName = name;

      //TODO: Refactor it!
      if (!plugin.getBoxCtrl) {
        plugin.getBoxCtrl = function () {
          return xpopupApi;
        };
      }
      if (!plugin.getWindowCtrl) {
        plugin.getWindowCtrl = function () {
          return xpopupApi.getWindowCtrl();
        };
      }
      plugin.getStorage = function () {
        return xpopupApi.getStorage();
      };

      //TODO: remove it
      plugin.getWindowData = function (checkNewData) {
        const st = this.getStorage();
        let data = null;

        if (checkNewData) {
          data = this.newWindowData;
          data = data || st.getBoxWindow().opts;
        } else {
          data = st.getBoxWindow().opts;
        }
        return data;
      };

      this.plugins = this.plugins || {};
      this.plugins[name] = plugin;
      // this.pluginInvoke(name, 'pluginInit');
    }

    pluginGet(name) {
      return this.plugins[name];
    }

    pluginGetContentTypePlugin(contentType) {
      return this.pluginGet("content_type." + contentType);
    }

    pluginInvoke(pluginName, funcName) {
      const p = this.pluginGet(pluginName);
      const args = Array.prototype.slice.call(arguments, 2);

      if (p[funcName]) {
        return p[funcName].apply(p, args);
      }
      return null;
    }

    pluginInvokeAll(hookName, newWindowData) {
      const st = this.getStorage();
      const utils = this.getUtils();
      const curWindowData =
        newWindowData || (st.getBoxWindow() && st.getBoxWindow().opts);

      if (!curWindowData || !curWindowData.type) return;

      const handlerName = utils.camelize("on_" + hookName); //window_settings_alter -> onWindowSettingsAlter

      //сначала выполним на плагине текущего типа
      const plugin = this.pluginGetContentTypePlugin(curWindowData.type);
      if (typeof plugin[handlerName] != "undefined") {
        if (newWindowData) {
          plugin.newWindowData = newWindowData;
        }
        plugin[handlerName].call(plugin);
        if (newWindowData) {
          plugin.newWindowData = null;
        }
      }

      //пробежимся по остальным активным плагинам
      Object.keys(this.plugins).forEach((pluginName) => {
        const plugin = this.plugins[pluginName];
        //Плагин типа content_type вызывался выше
        if (plugin.pluginType == "content_type") return;

        //У плагина нет такого хука
        if (typeof plugin[handlerName] != "undefined") {
          if (newWindowData) {
            plugin.newWindowData = newWindowData;
          }

          plugin[handlerName].call(plugin);

          if (newWindowData) {
            plugin.newWindowData = null;
          }
        }
      });
    }

    /// plugin system end ///

    getStorage() {
      if (!this._storageIntance) {
        this._storageIntance = new XpopupStorage();
      }
      return this._storageIntance;
    }

    getBoxCtrl() {
      return this;
    }

    getWindowCtrl() {
      return this.pluginGet("window_ctrl");
    }

    getUtils() {
      if (!this._utilsIntance) {
        this._utilsIntance = new XpopupUtils();
        // Object.freeze(this._utilsIntance);
      }
      return this._utilsIntance;
    }

    /**
     * Public static methods
     */
    back(options, triggerEl) {
      const st = this.getStorage();
      const winData = st.getCurrentWindow();
      const el = st.getElements();

      if (!winData || !winData.parentId) {
        console.warn("XPopup.back(): Parent window id is empty");
      }

      // 1. Сначала открываем родительское окно
      this.open({ id: winData.parentId });

      // 2. Затем удаляем текущее окно из стека
      //   st.removeWindowFromBox(winData.id);
      //   const plugin = $.xpopup.pluginGetContentTypePlugin(winData.opts.type);
      //   plugin.disposeContent(winData, el);
    }

    open(options, triggerEl) {
      const st = this.getStorage();
      const winCtrl = this.getWindowCtrl();

      if (this.defaults.debug)
        console.debug(
          "open called, options:",
          options,
          "triggerEl:",
          triggerEl,
        );

      let winData;

      options = options || {};
      if (options.id) {
        //Откроем окно, которое уже есть в кэше (например, для работы кнопки Back)
        winData = st.getBoxWindow(options.id);
        if (winData) {
          //Удалим результат предыдущего рендера, чтобы сформировать окно заново
          delete winData.opts.html;
        }
      } else {
        //Добавим данные окна в стэк
        if (triggerEl) {
          //triggerEl должен быть объектом HTMLElement.
          //Проверим, так ли это. При необходимости сделаем преобразование
          if (triggerEl instanceof jQuery) {
            triggerEl = triggerEl.get(0);
          } else if (typeof triggerEl == "string") {
            triggerEl = document.querySelector(triggerEl);
          }
        }
        winData = winCtrl._buildWindowData(options, triggerEl);

        // var boxId = winData.opts.boxId||1; //st.activeBoxId+1;
        if (!winData.opts.boxId) {
          st.activateBox();
        } else {
          st.activateBox(winData.opts.boxId);
        }

        st.addWindowToBox(winData);
      }

      if (winData) {
        //Загрузим и установим активное окно
        //Установим id нового окна.
        //Оно будет использоваться для фоновой загрузки и последующей обработки данных окна.
        st.setBoxNewWindow(winData.id);
        //Если текущего окна нет, то установим в качестве id текущего окна - id нового.
        //Это означает, что бокс только открывается.
        if (!st.getCurrentWindow()) {
          st.setCurWindow(winData.id);
        }

        //Запускаем процесс загрузки данных нового окна
        winCtrl.fetchContent();

        //разбираемся со старым окном (перенести в колбэк или ивент)
        if (!this.isOpen()) {
          xpopupApi.emit(xpopupApi.EVENT_BOX_OPEN_BEFORE);
        }
      } else {
        const msg = xpopupApi.t(
          "Msg__Incorrect_data_to_open_the_window",
          null,
          winData,
        );
        throw new SyntaxError(msg);
      }
    }

    closeWindow() {
      this.close("win");
    }

    closeBox() {
      this.close("box");
    }

    /**
     * Без параметров полностью закрывает все открытые боксы.
     * Если options.objType == 'win', то закрывает только текущее окно в текущем боксе.
     * Если options.objType == 'box', то закырывает текущий бокс.
     *
     * Если передан options.objCount,  то будет закрыто не менее options.objCount окон/боксов.
     *
     * Если переадан options.objCount или options.objType, то анимация при закрытии отключается (это временная мера)
     *
     * Примеры:
     *  xpopupApi.close(); закрыть всё
     *  xpopupApi.close({objType:'win'}); //закрыть тек. окно
     *  xpopupApi.close('win'); //закрыть тек. окно
     *  xpopupApi.close({objType:'box'}); //закрыть тек. бокс
     *  xpopupApi.close('box'); //закрыть тек. бокс
     *  xpopupApi.close({objType:'win',objCount:2}); //последовательно закрыть 2 окна
     *  xpopupApi.close({objType:'box',objCount:2}); //последовательно закрыть 2 бокса
     *
     * @param object options
     *   Определяет, что необходимо закрыть
     */
    close(options) {
      if (typeof options == "string") {
        options = { objType: options };
      }

      if (!options) {
        options = {};
      }

      switch (options.objType) {
        case "win":
          if (options.objCount > 1) {
            for (let i = 0; i < options.objCount; i++) {
              this.getWindowCtrl()._close();
            }
          } else {
            this.getWindowCtrl().close();
          }
          break;
        case "box":
          if (options.objCount > 1) {
            for (let i = 0; i < options.objCount; i++) {
              this.getWindowCtrl().close(); // закрываем бокс со всеми окнами
            }
          } else {
            this.getWindowCtrl().close();
          }
          break;
        default:
          // Без параметров — закрыть все открытые боксы
          // Вызываем close() последовательно для каждого бокса,
          // пока есть хотя бы один открытый
          let safetyCounter = 0;
          const maxIterations = 100; // защита от бесконечного цикла
          while (this.isOpen() && safetyCounter < maxIterations) {
            this.getWindowCtrl().close();
            safetyCounter++;
          }
          break;
      }
    }

    isOpen() {
      return this.getStorage().hasOpenBoxes();
    }

    /**
     * Позволяет добавить команды, которые будут выполняться при наступлении события eventName.
     *
     * @param String eventName [description]
     * @param Array commandsData   [description]
     */
    addEventCommands(eventName, commandsData) {
      $(document).on(eventName + xpopupApi.EVENT_NS, function () {
        if (typeof XSyst != "undefined") {
          XSyst.execCommands(commandsData);
        }
      });
    }

    setBoxStatus(newStatus) {
      const boxData = this.getStorage().getBox();
      const el = this.getStorage().getElements();

      if (!newStatus || newStatus == boxData.status) {
        return false;
      }

      const oldStatus = boxData.status;
      boxData.status = newStatus;

      if (el.$bg && el.$box) {
        xpopupApi
          .getUtils()
          .replaceClassesByPrefixes(
            el.$box,
            ["b-xpopup_box-status"],
            " b-xpopup_box-status_" + boxData.status,
            el.$boxAndBg,
          );
      }

      this.emit(xpopupApi.EVENT_BOX_NEW_STATUS, {
        newStatus: boxData.status,
        oldStatus: oldStatus,
      });

      return true;
    }

    //Events
    callDelayed(actionName, callback, delay) {
      xpopupApi._timers = xpopupApi._timers || {};

      if (xpopupApi._timers[actionName]) {
        clearTimeout(xpopupApi._timers[actionName]);
        delete xpopupApi._timers[actionName];
      }
      xpopupApi._timers[actionName] = setTimeout(function () {
        delete xpopupApi._timers[actionName];
        if (callback) {
          callback();
        }
      }, delay);
    }

    emit(eventName, data) {
      const utils = this.getUtils();
      const hook = eventName.replace(/^xpopup_/, "");

      this.pluginInvokeAll(hook, data);

      if (data) {
        $(document).trigger(eventName, [this, data]);
      } else {
        $(document).trigger(eventName, [this]);
      }

      // Если режим WebView в браузере webkit.
      //   if (xpopupApi.getUtils().isWebViewMode()) {
      //     // Уведомляем натив о событиях popup.
      //     // Для ios.
      //     if (window.webkit) {
      //       window.webkit.messageHandlers.xpopup.postMessage({
      //         event: eventName,
      //       });
      //     } // Для Android приложений.
      //     else {
      //     //   if (!XSyst._.isEmpty(window.xpopup)) {
      //       if (!utils.isEmpty(window.xpopup)) {
      //         window.xpopup.postMessage('{"event":"' + eventName + '"}');
      //       }
      //     }
      //   }
    }
  })()); ///xpopupApi end

  /**
   * jQuery plugin
   *
   * Открывает всплывающее окно jquery.xpopup для отображения изображений
   *
   * @param  object options [description]
   * @return {[type]}         [description]
   */
  $.fn.xbox = function () {
    return $(this).xpopup();
    // return $(this).xpopup({type:'image'});
  };

  /**
   * jQuery plugin
   *
   * Открывает всплывающее окно jquery.xpopup
   *
   * @param  object options [description]
   * @return {[type]}         [description]
   */
  $.fn.xpopup = function (options) {
    return $(this)
      .filter(":not(.b-xpopup-action_processed)")
      .addClass("b-xpopup-action_processed")
      .each(function () {
        const triggerEl = this;

        const actionClass = xpopupApi
          .getUtils()
          .filterClassesByPrefixes(triggerEl, "b-xpopup-action_type_")[0];

        return $(this).click(function () {
          let action = null;
          switch (actionClass) {
            case "b-xpopup-action_type_back":
              action = "back";
              break;
            case "b-xpopup-action_type_close":
              action = "close";
              break;
            case "b-xpopup-action_type_open":
            default:
              action = "open";
              break;
          }
          xpopupApi[action](options, triggerEl);
          return false;
        });
      });
  };
})(jQuery);
