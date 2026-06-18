/**
 * XpopupUtils — утилиты для xpopup
 *
 * Не зависит от xpopupApi, только от jQuery.
 * Используется через $.xpopup.getUtils().
 */
(function ($) {
  class XpopupUtils {
    /**
     * Parse a JSON response.
     *
     * The result is either the JSON object, or an object with 'status' 0 and 'data' an error message.
     *
     * ОБНОВЛЕНИЕ: убран небезопасный eval, заменён на JSON.parse с try...catch.
     * Параметр useEval сохранён для обратной совместимости, но игнорируется.
     *
     * @param String data
     * @param Bool|null useEval
     * @return Object
     */
    parseJson(data, useEval) {
      if (data === null || data === undefined) {
        return null;
      }

      if (typeof data !== "string") {
        return data;
      }

      const trimmedData = data.trim();

      if (
        trimmedData.substring(0, 1) != "{" &&
        trimmedData.substring(0, 1) != "["
      ) {
        return data;
      }

      try {
        return JSON.parse(trimmedData);
      } catch (e) {
        console.warn(
          "XpopupUtils.parseJson: Failed to parse JSON",
          e.message,
          "Data:",
          trimmedData.substring(0, 100),
        );
        return data;
      }
    }

    /**
     * Формирует объект с data-параметрами ajax-запроса,
     * переданных для текущего окна в виде data-post="param1=value1&param2=value2.."
     *
     * @param  object el
     * @return object
     */
    extractDataPostParams(el) {
      const fromDataPost = {};

      if (el) {
        const dataPost = $(el).data("post");
        if (dataPost) {
          dataPost.replace(/([^=&]+)=([^&]*)/g, function (m, key, value) {
            fromDataPost[decodeURIComponent($.trim(key))] = decodeURIComponent(
              $.trim(value),
            );
          });
        }
      }
      return fromDataPost;
    }

    /**
     * Возвращает ссылку на history api.
     */
    getHistoryApi() {
      return window.history;
    }

    /**
     * Возвращает true, если используется смартфон.
     */
    // isPhone(winData) {
    //   return window.innerWidth < 480;
    // }
    /**
     * Возвращает true, если используется смартфон.
     * Использует комбинацию: User Agent, pointer, touch, ширина экрана.
     */
    isPhone() {
      if (this._isPhone !== undefined) return this._isPhone;

      const ua = navigator.userAgent || "";
      const isMobileUA = /Mobi|Android|iPhone|iPod/i.test(ua);
      const hasCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
      const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      const smallScreen = window.innerWidth < 480;

      this._isPhone =
        smallScreen && (hasTouch || hasCoarsePointer || isMobileUA);
      return this._isPhone;
    }

    /**
     * Возвращает true, если используется планшет.
     */
    // isTablet(winData) {
    //   return window.innerWidth >= 480 && window.innerWidth < 1024;
    // }
    isTablet() {
      if (this._isTablet !== undefined) return this._isTablet;

      const ua = navigator.userAgent || "";
      const isTabletUA =
        /iPad|Tablet|PlayBook/i.test(ua) ||
        (/Android/i.test(ua) && !/Mobi/i.test(ua));
      const hasCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
      const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      const mediumScreen = window.innerWidth >= 480 && window.innerWidth < 1024;

      this._isTablet =
        mediumScreen && (hasTouch || hasCoarsePointer || isTabletUA);
      return this._isTablet;
    }

    /**
     * Возвращает true, если используется десктоп.
     */
    isDesktop() {
      return !this.isPhone() && !this.isTablet();
    }

    /**
     * Возвращает true, если скроллбар накладывается поверх контента
     * (iOS Safari, мобильные браузеры, macOS с трекпадом).
     *
     * Возвращает false, если скроллбар занимает место в ширине
     * (классические десктопные браузеры: Windows Chrome, Firefox).
     */
    isScrollbarOverlay() {
      if (this._isScrollbarOverlay !== undefined) {
        return this._isScrollbarOverlay;
      }

      const hasClassicScrollbar =
        window.innerWidth > document.documentElement.clientWidth;
      const ua = navigator.userAgent || "";
      const isIOS = /iPhone|iPad|iPod/i.test(ua);
      const isAndroid = /Android/i.test(ua);
      const isMacOverlay = /Mac/i.test(ua) && navigator.platform === "MacIntel";

      this._isScrollbarOverlay =
        !hasClassicScrollbar || isIOS || isAndroid || isMacOverlay;
      return this._isScrollbarOverlay;
    }

    /**
     * Возвращает true, если окно вызвано из WebView.
     *
     * Примечание: В настоящее время работает только в контексте XSyst.
     */
    // isWebViewMode() {
    //   return typeof XSyst != "undefined" && XSyst.settings.viewWebView;
    // }

    /**
     * Возвращает true, если url локальный.
     *
     * @param url
     *   The URL string to be tested.
     *
     * @return
     *   Boolean true if local, or false if the url may be external or have a scheme.
     *
     * @see https://github.com/jquery/jquery-ui/blob/1.11.4/ui/tabs.js#L58
     */
    urlIsLocal(url) {
      // Always use browser-derived absolute URLs in the comparison, to avoid
      // attempts to break out of the base path using directory traversal.
      var absoluteUrl = XSyst.absoluteUrl(url);

      var protocol = location.protocol;

      // Consider URLs that match this site's base URL but use HTTPS instead of HTTP
      // as local as well.
      if (protocol === "http:" && absoluteUrl.indexOf("https:") === 0) {
        protocol = "https:";
      }
      var baseUrl =
        protocol + "//" + location.host + XSyst.settings.basePath.slice(0, -1);

      // Decoding non-UTF-8 strings may throw an exception.
      try {
        absoluteUrl = decodeURIComponent(absoluteUrl);
      } catch (e) {}
      try {
        baseUrl = decodeURIComponent(baseUrl);
      } catch (e) {}

      // The given URL matches the site's base URL, or has a path under the site's
      // base URL.
      return (
        absoluteUrl === baseUrl || absoluteUrl.indexOf(baseUrl + "/") === 0
      );
    }

    /**
     * Преобразует camelCase в dashed-case
     *
     * Пример:
     *  camelToDash('xpopupBoxId') -> xpopup-box-id
     */
    camelToDash(key) {
      return key.replace(/([A-Z])/g, "-$1").toLowerCase();
    }

    /**
     * Преобразует строку в camelCase
     *
     * Пример:
     *   camelize('xpopup-box-id') -> xpopupBoxId
     *   camelize('window_settings_alter', true) -> WindowSettingsAlter
     *   camelize('on_window_settings_alter') -> onWindowSettingsAlter
     */
    camelize(str, uppercaseFirstCharacter = false) {
      if (uppercaseFirstCharacter) {
        str = " " + str;
      }
      return str.replace(/[^a-zA-Z0-9]+(.)/g, (match, chr) => {
        return chr.toUpperCase();
      });
    }

    /**
     * Наипростейший шаблонизатор.
     * Заменяет все переменные вида {varname} значениями из объекта values.
     */
    renderTemplate(template, values) {
      let res = template;
      values = values || {};
      Object.keys(values).forEach((key) => {
        res = res.replace(new RegExp("{" + key + "}", "g"), values[key]);
      });
      return res;
    }

    /**
     * Выбирает среди всех классов элемента $sourceEl, только те css-классы,
     * которые имеют один из префиксов, перечисленных в массиве classesPrefixes.
     * Если такие найдены, то удаляет эти классы из $targetEl.
     * Если переданы addClasses, то эти классы добавляются в $targetEl.
     * Если $targetEl не передан, то классы удаляются из $sourceEl.
     */
    replaceClassesByPrefixes(
      $sourceEl,
      removeClassesPrefixes,
      addClasses,
      $targetEl,
    ) {
      const removeClasses = this.filterClassesByPrefixes(
        $sourceEl,
        removeClassesPrefixes,
      ).join(" ");
      if (!$targetEl) {
        $targetEl = $sourceEl;
      }
      if (removeClasses) {
        $targetEl.removeClass(removeClasses);
      }
      if (addClasses) {
        $targetEl.addClass(addClasses);
      }
    }

    /**
     * Выбирает среди всех классов элемента el, только те, которые имеют один из префиксов,
     * перечисленных в массиве classesPrefixes.
     */
    filterClassesByPrefixes(el, classesPrefixes) {
      if (!el || !classesPrefixes) {
        return [];
      }

      if (typeof classesPrefixes === "string") {
        classesPrefixes = [classesPrefixes];
      }

      const classes = $(el).attr("class").split(/\s+/g);

      const matchedClasses = [];
      for (let i = 0; i < classes.length; i++) {
        const cl = classes[i];
        for (let j = 0; j < classesPrefixes.length; j++) {
          const prefix = classesPrefixes[j];
          if (cl.indexOf(prefix) != -1) {
            matchedClasses.push(cl);
          }
        }
      }

      return matchedClasses;
    }

    isEmpty(mixedVar) {
      return (
        typeof mixedVar === "undefined" ||
        mixedVar === "" ||
        mixedVar === 0 ||
        mixedVar === "0" ||
        mixedVar === null ||
        mixedVar === false ||
        (Array.isArray(mixedVar) && mixedVar.length === 0)
      );
    }
  }

  // Экспортируем класс в глобальную область видимости для использования в других модулях
  window.XpopupUtils = XpopupUtils;
})(jQuery);
