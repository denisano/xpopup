(function ($) {
  const xpopupApi = $.xpopup;
  const DEBUG = xpopupApi.defaults.debug;

  /**
   * Автоматическая инициализация xpopup-действий через data-атрибуты
   *
   * data-xpopup-open  — открыть попап
   * data-xpopup-close — закрыть попап
   * data-xpopup-back  — вернуться к родительскому окну
   *
   * Примеры:
   *   <a href="photo.jpg" data-xpopup-open>Открыть фото</a>
   *   <a href="#content" data-xpopup-open data-xpopup-skin="ios">Окно iOS</a>
   *   <button data-xpopup-close>Закрыть</button>
   *   <button data-xpopup-back>Назад</button>
   */
  $(document).on("click", "[data-xpopup-open]", function (e) {
    e.preventDefault();

    var $el = $(this);
    var options = {};

    // Извлекаем все data-xpopup-* атрибуты в объект опций
    var data = $el.data();
    Object.keys(data).forEach(function (key) {
      var propName = key.charAt(0).toLowerCase() + key.slice(1);
      var value = data[key];

      if (value === "true" || value === "false") {
        options[propName] = new Boolean(value).valueOf();
      } else {
        options[propName] = value;
      }
    });

    // Если это ссылка с href — используем href как content
    if (
      !options.content &&
      $el.attr("href") &&
      $el.attr("href") !== "javascript:void(0);"
    ) {
      options.content = $el.attr("href");
    }

    $.xpopup.open(options, $el[0]);
  });

  $(document).on("click", "[data-xpopup-close]", function (e) {
    e.preventDefault();
    $.xpopup.close();
  });

  $(document).on("click", "[data-xpopup-back]", function (e) {
    e.preventDefault();
    $.xpopup.back();
  });

  /**
   * Реализация автооткрытия xpopup-окна.
   * В настоящий момент реализован обработчик для открытия окна при наличии спец. хэша в URL страницы.
   * В будущем возможно добавление иных триггеров для автооткрытия xpopup-окна.
   */
  if (!window.xpopupAutoRunner) {
    // Разрешаем запуск только один раз
    window.xpopupAutoRunner = true;

    // Запускаем обработку при загрузке страницы
    $(document).ready(function () {
      xpopupProcessUrlHash();
    });

    // Добавим поддержку событий от history api.
    // Это позволит отслеживать любые изменения URL и, в том числе, корректно реагировать на кнопки браузера Back/Forward
    window.addEventListener("popstate", function (e) {
      xpopupProcessUrlHash();
    });
  }

  function xpopupProcessUrlHash() {
    const isOpen = xpopupApi.isOpen();

    if (DEBUG)
      console.debug(
        "xpopupProcessUrlHash called, isOpen:",
        isOpen,
        "hash:",
        location.hash,
      );

    if (!location.hash) {
      // Если хэш пустой и окно открыто — закроем его
      if (isOpen) {
        xpopupApi.close();
      }
      return;
    }

    const hashValue = location.hash.substring(1); // Удалим #
    const equalSignIndex = hashValue.indexOf("=");

    if (equalSignIndex === -1) {
      // Нет знака '=', это не xpopup-хэш
      if (isOpen) {
        // TODO: исправить! Этот код может закрывать popup при клике по табам с хэшами внутри него.
        // Пока оставляем как есть для обратной совместимости
        xpopupApi.close();
      }
      return;
    }

    const hashName = hashValue.substring(0, equalSignIndex);
    const hashParams = hashValue.substring(equalSignIndex + 1);

    if (hashName !== "xpopup") {
      if (isOpen) {
        xpopupApi.close();
      }
      return;
    }

    // Кажется наш случай..
    // Будем обрабатывать xpopup-хэш и показывать окно.
    const hashItems = hashParams.split(",");
    const options = {};

    hashItems.forEach(function (item) {
      const colonIndex = item.indexOf(":");
      if (colonIndex === -1) {
        return; // Пропускаем некорректные элементы
      }
      const propKey = item.substring(0, colonIndex);
      let propVal = item.substring(colonIndex + 1);

      propVal = decodeURIComponent(propVal);

      // Преобразуем типы значений
      if (propVal === "true") {
        propVal = true;
      } else if (propVal === "false") {
        propVal = false;
      } else if (!isNaN(propVal) && propVal !== "") {
        // Проверяем, является ли значение числом
        if (propVal.indexOf(".") !== -1) {
          propVal = parseFloat(propVal);
        } else {
          propVal = parseInt(propVal, 10);
        }
      }

      options[propKey] = propVal;
    });

    if (options.type) {
      xpopupApi.open(options);
    }
  }
})(jQuery);
