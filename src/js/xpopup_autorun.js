(function ($) {
    const xpopupApi = $.xpopup;
    const DEBUG = $.xpopup.DEBUG;

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
        window.addEventListener('popstate', function (e) {
            xpopupProcessUrlHash();
        });
    }

    function xpopupProcessUrlHash() {
        const isOpen = xpopupApi.isOpen();

        if (DEBUG)
            console.debug('xpopupProcessUrlHash called, isOpen:', isOpen, 'hash:', location.hash);

        if (!location.hash) {
            // Если хэш пустой и окно открыто — закроем его
            if (isOpen) {
                xpopupApi.close();
            }
            return;
        }

        const hashValue = location.hash.substring(1); // Удалим #
        const equalSignIndex = hashValue.indexOf('=');

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

        if (hashName !== 'xpopup') {
            if (isOpen) {
                xpopupApi.close();
            }
            return;
        }

        // Кажется наш случай..
        // Будем обрабатывать xpopup-хэш и показывать окно.
        const hashItems = hashParams.split(',');
        const options = {};

        hashItems.forEach(function (item) {
            const colonIndex = item.indexOf(':');
            if (colonIndex === -1) {
                return; // Пропускаем некорректные элементы
            }
            const propKey = item.substring(0, colonIndex);
            let propVal = item.substring(colonIndex + 1);

            propVal = decodeURIComponent(propVal);

            // Преобразуем типы значений
            if (propVal === 'true') {
                propVal = true;
            } else if (propVal === 'false') {
                propVal = false;
            } else if (!isNaN(propVal) && propVal !== '') {
                // Проверяем, является ли значение числом
                if (propVal.indexOf('.') !== -1) {
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
