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
         * Примечание: перенесено из XSyst
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

            if (typeof data !== 'string') {
                return data;
            }

            const trimmedData = data.trim();

            if (trimmedData.substring(0, 1) != '{' && trimmedData.substring(0, 1) != '[') {
                return data;
            }

            try {
                return JSON.parse(trimmedData);
            } catch (e) {
                console.warn(
                    'XpopupUtils.parseJson: Failed to parse JSON',
                    e.message,
                    'Data:',
                    trimmedData.substring(0, 100),
                );
                return data;
            }
        }

        /**
         * Формирует объект с data-параметрами ajax-запроса,
         * переданных для текущего окна в виде data-post="param1=value1&param2=value2.."
         *
         * Примечание: перенесено из XSyst.ajax
         *
         * @param  object el
         * @return object
         */
        extractDataPostParams(el) {
            const fromDataPost = {};

            if (el) {
                const dataPost = $(el).data('post');
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
        isPhone(winData) {
            return window.innerWidth < 480;
        }

        /**
         * Возвращает true, если используется планшет.
         */
        isTablet(winData) {
            return window.innerWidth >= 480 && window.innerWidth < 1024;
        }

        /**
         * Возвращает true, если окно вызвано из WebView.
         *
         * Примечание: В настоящее время работает только в контексте XSyst.
         */
        isWebViewMode() {
            return typeof XSyst != 'undefined' && XSyst.settings.viewWebView;
        }

        /**
         * Возвращает true, если url локальный.
         *
         * Примечание: В настоящее время работает только в контексте XSyst.
         * Примечание: перенесено из XSyst.ajax
         */
        urlIsLocal(url) {
            return typeof XSyst != 'undefined' && XSyst.urlIsLocal(url);
        }

        /**
         * Преобразует camelCase в dashed-case
         *
         * Пример:
         *  camelToDash('xpopupBoxId') -> xpopup-box-id
         */
        camelToDash(key) {
            return key.replace(/([A-Z])/g, '-$1').toLowerCase();
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
                str = ' ' + str;
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
                res = res.replace(new RegExp('{' + key + '}', 'g'), values[key]);
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
        replaceClassesByPrefixes($sourceEl, removeClassesPrefixes, addClasses, $targetEl) {
            const removeClasses = this.filterClassesByPrefixes(
                $sourceEl,
                removeClassesPrefixes,
            ).join(' ');
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

            if (typeof classesPrefixes === 'string') {
                classesPrefixes = [classesPrefixes];
            }

            const classes = $(el).attr('class').split(/\s+/g);

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
    }

    // Экспортируем класс в глобальную область видимости для использования в других модулях
    window.XpopupUtils = XpopupUtils;
})(jQuery);