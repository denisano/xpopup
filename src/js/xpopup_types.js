(function ($) {
    const DEBUG = $.xpopup.DEBUG;
    const xpopupUtils = $.xpopup.getUtils();

    /**
     * AJAX content source plugin
     */
    class XpopupAjaxContent {
        constructor() {
            this.defaults = {
                closeOnContentClick: false,
                tError: '<a href="%url%">The content</a> could not be loaded.',
            };
        }

        _destroyAjaxRequest() {
            const st = this.getStorage();
            const winData = st.getBoxWindow();

            if (winData._req) {
                winData._req.abort();
            }
        }

        /**
         * Handler of event 'window_settings_after'
         */
        onWindowSettingsAlter() {
            const winDataOpts = this.getWindowData(true);

            if (!winDataOpts.content && winDataOpts.triggerEl) {
                winDataOpts.content = winDataOpts.triggerEl.getAttribute('href');
            }
        }

        /**
         * Handler of event 'window_dispose_before'
         */
        onWindowDisposeBefore() {
            this._destroyAjaxRequest();
        }

        /**
         * Handler of event 'window_loading'
         */
        onWindowLoading() {
            this.getWindowCtrl().setWindowStatus('loading');
        }

        /**
         * Handler of event 'window_ready'
         */
        onWindowReady() {
            const st = this.getStorage();
            const winData = st.getBoxWindow();

            delete winData._req;
        }

        fetchAndBuildContent(successCallback, errorCallback) {
            // const plugin = this;
            const st = this.getStorage();
            const winData = st.getBoxNewWindow();

            // plugin.getWindowCtrl().setWindowStatus('loading');

            //Сформируем объект с POST-параметрами, если они были переданы в виде аттрибута data-post="param1=value1&param2=value2"
            let reqData = xpopupUtils.extractDataPostParams(winData.triggerEl);
            //Возможно, доп. параметры запроса были переданы в виде опции reqParams
            if (winData.opts.reqParams) {
                // reqData = $.extend(true, {}, reqData, winData.opts.reqParams);
                reqData = {
                    ...reqData,
                    ...winData.opts.reqParams,
                };
            }

            const ajaxRequestOpts = {
                url: winData.opts.content,
                data: reqData,
                success: function (data, textStatus, jqXHR) {
                    const temp = {
                        response: data,
                        xhr: jqXHR,
                    };

                    //Уведомим слушателей об успешной загрузке данных xpopup-окна.
                    //Слушатели могут отреагировать на это событие или даже изменить данные для отображения в окне.
                    $.xpopup.emit($.xpopup.EVENT_WINDOW_AJAX_SUCCESS, temp);

                    if (temp.ajaxResponseOptions) {
                        //Слушатели на основании полученных данных сформировали свой набор опций для отображения в окне.
                        //Эта возможность используется в xsyst_ajax_extra.js, чтобы реализовать обработку команды xoverlay_display.
                        winData.ajaxResponseOptions = temp.ajaxResponseOptions;
                    }
                    // ОБНОВЛЕНИЕ: замена $.type на typeof
                    else if (typeof temp.response === 'string') {
                        //Контент - это простой html, который необходимо отобразить
                        winData.ajaxResponseOptions = {
                            html: temp.response,
                        };
                    } else {
                        //Пришел набор опций, для отображения окна
                        winData.ajaxResponseOptions = temp.response;
                    }

                    // plugin.getWindowCtrl().renderContent();
                    successCallback(winData);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    // ОБНОВЛЕНИЕ: улучшенная обработка ошибок с более информативным сообщением
                    const errMsg = winData.opts.tError.replace('%url%', winData.opts.content);

                    // Логируем подробности ошибки для отладки
                    console.warn(
                        'XPopup AJAX Error:',
                        errMsg,
                        '\nStatus:',
                        textStatus,
                        '\nError:',
                        errorThrown,
                        '\nURL:',
                        winData.opts.content,
                    );

                    // Устанавливаем статус ошибки и передаем сообщение
                    // plugin.getWindowCtrl().setWindowStatus('error', errMsg);
                    errorCallback(winData, errMsg);
                },
            };

            //Allow changing ajax request options
            $.xpopup.emit($.xpopup.EVENT_WINDOW_AJAX_REQUEST_BEFORE, ajaxRequestOpts);

            //Let's go..
            winData._req = $.ajax(ajaxRequestOpts);
        }

        // renderContent() {
        //     const st = this.getStorage();
        //     const winData = st.getBoxWindow();

        //     delete winData._req;
        // }
    }

    $.xpopup.registerPlugin('content_type.ajax', new XpopupAjaxContent());

    /**
     * INLINE content source plugin
     */
    class XpopupInlineContent {
        constructor() {
            this.defaults = {
                closeOnContentClick: false,
                tNotFound: 'Content not found',
            };
        }

        _putInlineElementsBack(winData, elements) {
            // const st = this.getStorage();
            // const winData = st.getBoxWindow();
            // const el = st.getElements();
console.debug('_putInlineElementsBack called', winData, elements);

            // Проверяем, что есть что возвращать
            if (!winData || !winData.$_detachedElement) {
                return;
            }

            const $_el = winData.$_detachedElement.detach();
            if (winData._detachedElementVisibility === false) {
                $_el.hide();
            }
            if (winData.$_detachedElementParent != null) {
                winData.$_detachedElementParent.append($_el);
                winData.$_detachedElement = null;
                winData.$_detachedElementParent = null;
            } else {
                $(winData.triggerEl).after($_el);
                winData.$_detachedElement = null;
            }
            elements.$content = null;
        }

        /**
         * Handler of event 'window_dispose_before'
         */
        onWindowDisposeBefore() {
            const st = this.getStorage();
            const winData = st.getBoxWindow();
            const el = st.getElements();
            
            this._putInlineElementsBack(winData, el);
        }
        // onWindowRenderContentBefore() {
        //     debugger;
        //     this._putInlineElementsBack();
        // }

        fetchAndBuildContent(successCallback, errorCallback) {
            const plugin = this;
            const st = this.getStorage();
            const curWinData = st.getBoxWindow();
            const winData = st.getBoxNewWindow();
            const elements = st.getElements();
console.debug('XpopupInlineContent.fetchAndBuildContent called', winData);
            // this._putInlineElementsBack();

            if (!winData.opts.content && winData.triggerEl) {
                // winData.opts.content = winData.triggerEl.getAttribute('href');
            }
            if (!winData.opts.headerCaption && winData.triggerEl) {
                winData.opts.headerCaption = winData.triggerEl.getAttribute('title');
            }

            if (winData.opts.content) {
                //Если указан winData.opts.content, значит ищем соответствующий ему элемент
                const $el = $(winData.opts.content).first(); //winData.opts.content - это css-selector

                $.xpopup.callDelayed(
                    'renderContent',
                    () => {
                        console.debug('XpopupInlineContent.fetchAndBuildContent - delayed callback called', {...curWinData});
                        plugin._putInlineElementsBack(curWinData, elements);
                        debugger;
                        if ($el.length) {
                            //Если нашли - показываем
                            winData.opts.html = $el;
                            // If target element has parent - we replace it with placeholder and put it back after popup is closed
                            const parent = $el[0].parentNode;
                            if (parent && parent.tagName) {
                                //Сохраним необходимые данные для возврата восстановления исходного состояния элемента после закрытия popup-окна
                                winData._detachedElementVisibility = $el.is(':visible');
                                winData.$_detachedElementParent = $(parent);
                                winData.$_detachedElement = $el.detach();
                                if (winData._detachedElementVisibility === false) {
                                    //Если элемент скрыт (display:none), то необходимо сделать его видимым перед вставкой в popup-окно
                                    $el.show();
                                }
                                console.debug('XpopupInlineContent.fetchAndBuildContent - element detached and stored for later restoration', winData);
                            }

                            successCallback(winData);
                            st.updateWindow(winData);
                        } else {
                            //Элемент не найден - показываем ошибку
                            const errMsg = winData.opts.tNotFound;
                            winData.opts.html =
                                '<div class="b-xpopup-error">' + winData.opts.tNotFound + '</div>';
                            errorCallback(winData, errMsg);
                        }
                    },
                    winData.opts.minLoadingTimeout,
                );

                // if ($el.length) {
                //     //Если нашли - показываем
                //     winData.opts.html = $el;
                //     // If target element has parent - we replace it with placeholder and put it back after popup is closed
                //     const parent = $el[0].parentNode;
                //     if (parent && parent.tagName) {
                //         //Сохраним необходимые данные для возврата восстановления исходного состояния элемента после закрытия popup-окна
                //         winData._detachedElementVisibility = $el.is(':visible');
                //         winData.$_detachedElementParent = $(parent);
                //         winData.$_detachedElement = $el.detach();
                //         if (winData._detachedElementVisibility === false) {
                //             //Если элемент скрыт (display:none), то необходимо сделать его видимым перед вставкой в popup-окно
                //             $el.show();
                //         }
                //     }

                //     successCallback(winData);
                // } else {
                //     //Элемент не найден - показываем ошибку
                //     const errMsg = winData.opts.tNotFound;
                //     winData.opts.html =
                //         '<div class="b-xpopup-error">' + winData.opts.tNotFound + '</div>';
                //     errorCallback(winData, errMsg);
                // }
            } else {
                //Если winData.opts.content пустой, значит попробуем получить контент из следующего за winData.triggerEl div-элемента.
                //Внимание: важно, чтобы это был именно следующий элемент и он был скрыт с помощью style='display:none;'
                const $el = $(winData.triggerEl.nextElementSibling);
                if ($el.length && $el.is(':visible') == false) {
                    winData.opts.html = $el;

                    //Сохраним необходимые данные для возврата восстановления исходного состояния элемента после закрытия popup-окна
                    winData._detachedElementVisibility = false;
                    winData.$_detachedElement = $el.detach();
                    $el.show();

                    // plugin.getWindowCtrl().renderContent();
                    successCallback(winData);
                }
            }
        }

        // renderContent() {
        //     // const st = this.getStorage();
        //     // const winData = st.getBoxWindow();
        //     // if (winData.opts.html) {
        //     //   const $el = $(winData.opts.html);
        //     //   // If target element has parent - we replace it with placeholder and put it back after popup is closed
        //     //   const parent = $el[0].parentNode;
        //     //   if (parent && parent.tagName) {
        //     //     winData.$_detachedElement = $el.detach();
        //     //     winData.$_detachedElementParent = $(parent);
        //     //     winData._detachedElementVisibility = $el.is(':visible');
        //     //     if (winData._detachedElementVisibility === false) {
        //     //       //Если элемент скрыт (display:none), то необходимо сделать его видимым перед вставкой в popup-окно
        //     //       $el.show();
        //     //     }
        //     //   }
        //     //   this.getWindowCtrl().setContent($el,'inline');
        //     // }
        // }
    }
    $.xpopup.registerPlugin('content_type.inline', new XpopupInlineContent());

    /**
     * IMAGE content source plugin
     *
     * ОБНОВЛЕНИЯ:
     * - Улучшенная предзагрузка изображений галереи с кэшированием
     * - Более информативная обработка ошибок загрузки
     * - Заменены устаревшие методы $.each, $.type на нативные аналоги
     */
    class XpopupImageContent {
        //вставляем изображение в естественных размерах
        markup = `
<div class="b-xpopup__content-inner">
  <div class="b-xpopup__size-holder b-xpopup-image">
    <div class="b-xpopup-image__anim-layer">
      <img src="{src}" class="b-xpopup-image__img" />
    </div>
    <div class="b-xpopup__image-text">{text}</div>
  </div>
  <div style="display:{displayTitle};" class="b-xpopup__image-title">{title}</div>
</div>
`;

        constructor() {
            this.defaults = {
                skin: 'lite',
                skinMod: 'no-border',
                bgAnimation: true, // включено, наследует эффекты из общих defaults
                boxAnimation: true, // включено, наследует эффекты из общих defaults
                boxAnimationOpen: 'zoom-in',
                boxAnimationClose: 'zoom-out',
                markup: this.markup,
                sizeMode: 'screen',
                closeOnBgClick: true,
                // closeBtnType: 'outside',
                tError: '<a href="{url}">The image {url}</a> could not be loaded.',
                tNotFound: 'Image %url is not available',
            };
        }

        /**
         * Handler of event 'window_settings_after'
         */
        onWindowSettingsAlter() {
            const winDataOpts = this.getWindowData(true);

            if (!winDataOpts.content && winDataOpts.triggerEl) {
                winDataOpts.content = winDataOpts.triggerEl.getAttribute('href');
            }
            winDataOpts.headerSticked = false;
        }

        /**
         * Handler of event 'window_dispose_before'
         * Отменяет загрузку изображения при закрытии окна
         */
        onWindowDisposeBefore() {
            const st = this.getStorage();
            const winData = st.getBoxWindow();
            const newWinData = st.getBoxNewWindow();

            // Отменяем загрузку текущего изображения
            if (winData && winData.$img) {
                winData.$img.off('.xpopup_loader');
                if (winData.$img[0]) {
                    winData.$img[0].src = ''; // останавливает загрузку
                }
                winData.$img.remove();
                winData.$img = null;
            }

            // Отменяем загрузку нового изображения (если открывается)
            if (newWinData && newWinData !== winData && newWinData.$img) {
                newWinData.$img.off('.xpopup_loader');
                if (newWinData.$img[0]) {
                    newWinData.$img[0].src = '';
                }
                newWinData.$img.remove();
                newWinData.$img = null;
            }
        }

        /**
         * Handler of event 'window_ready'
         */
        onWindowReady() {
            if (DEBUG) console.debug('XpopupImageContent.onWindowReady called');

            // const plugin = this;
            const st = this.getStorage();
            const winData = st.getBoxWindow();

            // plugin.getWindowCtrl().setWindowStatus('ready');

            if (winData.$img) {
                winData.$img.remove();
                winData.$img = null;
            }

            // не очищаем кеш галереи при рендере,
            // чтобы при переключении изображения использовать предзагруженные данные.
            // Кеш будет очищен при закрытии окна.
        }

        /**
         * Предзагружает соседние изображения и кэширует их для мгновенного показа.
         * Логика:
         * - Сначала грузим 5 вперёд (куда обычно листают)
         * - Потом 2 назад
         * - Остальные — в фоне через 500ms, когда текущее изображение уже показано
         *
         * @param {object} winData - данные текущего окна
         * @param {HTMLElement} triggerEl - элемент-триггер
         */
        _preloadGalleryImages(winData, triggerEl) {
            const rel = triggerEl.getAttribute('rel');
            if (!rel || !winData.opts.preloader) {
                return;
            }

            if (!winData._galleryPreloadCache) {
                winData._galleryPreloadCache = {};
            }

            const galleryItems = triggerEl.parentElement.querySelectorAll(
                `.b-xpopup-gallery[rel="${rel}"]`,
            );

            const currentIndex = winData.galleryItemIndex;
            const totalItems = galleryItems.length;

            // Приоритетная предзагрузка: вперёд больше, чем назад
            // Вперёд: 5 изображений, назад: 2 изображения
            const forwardRange = Math.min(5, totalItems - currentIndex - 1);
            const backwardRange = Math.min(2, currentIndex);

            let preloadedCount = 0;

            // Сначала грузим вперёд (приоритетно)
            for (let i = 1; i <= forwardRange; i++) {
                const item = galleryItems[currentIndex + i];
                if (item) {
                    const href = item.getAttribute('href');
                    if (href && !winData._galleryPreloadCache[href]) {
                        const imagePreloader = new Image();
                        imagePreloader.src = href;
                        winData._galleryPreloadCache[href] = imagePreloader;
                        preloadedCount++;
                        item.classList.add('_preloaded');
                    }
                }
            }

            // Затем грузим назад
            for (let i = 1; i <= backwardRange; i++) {
                const item = galleryItems[currentIndex - i];
                if (item) {
                    const href = item.getAttribute('href');
                    if (href && !winData._galleryPreloadCache[href]) {
                        const imagePreloader = new Image();
                        imagePreloader.src = href;
                        winData._galleryPreloadCache[href] = imagePreloader;
                        preloadedCount++;
                        item.classList.add('_preloaded');
                    }
                }
            }

            // Фоновая загрузка остальных (не спеша, после паузы)
            if (totalItems > forwardRange + backwardRange + 1) {
                setTimeout(() => {
                    galleryItems.forEach((item, index) => {
                        // Пропускаем уже загруженные
                        if (Math.abs(index - currentIndex) <= forwardRange && index >= currentIndex)
                            return;
                        if (index >= currentIndex - backwardRange && index < currentIndex) return;
                        if (index === currentIndex) return;

                        const href = item.getAttribute('href');
                        if (href && !winData._galleryPreloadCache[href]) {
                            const imagePreloader = new Image();
                            imagePreloader.src = href;
                            winData._galleryPreloadCache[href] = imagePreloader;
                            item.classList.add('_preloaded');
                        }
                    });
                }, 500);
            }

            if (preloadedCount > 0 && DEBUG) {
                console.debug(
                    'XPopup Gallery: preloaded',
                    preloadedCount,
                    'images (forward:',
                    forwardRange,
                    'backward:',
                    backwardRange,
                    ')',
                );
            }
        }

        /**
         * Проверяет, есть ли изображение в кеше предзагрузки.
         * Если есть — возвращает true и устанавливает src из кеша мгновенно.
         *
         * @param {object} winData - данные текущего окна
         * @param {string} imgSrc - URL изображения
         * @param {HTMLImageElement} img - элемент изображения
         * @returns {boolean} - true, если изображение взято из кеша
         */
        _tryLoadFromCache(winData, imgSrc, img) {
            if (
                winData._galleryPreloadCache &&
                winData._galleryPreloadCache[imgSrc] &&
                winData._galleryPreloadCache[imgSrc].complete
            ) {
                // Изображение уже в кеше и полностью загружено — используем его
                img.src = imgSrc;
                console.debug('XPopup Gallery: loaded from cache:', imgSrc);
                return true;
            }
            return false;
        }

        fetchAndBuildContent(successCallback, errorCallback) {
            const plugin = this;
            const st = this.getStorage();
            const winData = st.getBoxNewWindow();

            // setWindowStatus('loading') уже вызван в общем fetchContent()
            // plugin.getWindowCtrl().setWindowStatus('loading'); // убрано — дубликат

            const imgSrc = winData.opts.content;
            const img = document.createElement('img');

            // Выделили предзагрузку в отдельный метод
            if (winData.triggerEl) {
                this._preloadGalleryImages(winData, winData.triggerEl);
            }

            winData.$img = $(img);

            let title = winData.opts.headerCaption;
            if (!title && winData.triggerEl) {
                title = winData.triggerEl.getAttribute('title');
            }
            // title='Это тестовое название изображение!';
            const displayTitle = title ? 'block' : 'none';

            ///event handlers
            // image load complete handler
            const onLoadHandler = function () {
                if (DEBUG) console.debug('XpopupImageContent.onLoadHandler called');

                //Получаем winData как st.getBoxNewWindow(). Если брать winData из замыкания, то
                //изменения (winData.opts.html = $template) в таком winData не будут сохраняться!!!
                const winData = st.getBoxNewWindow(); //???
                const success =
                    winData.$img && winData.$img[0].complete && winData.$img[0].width > 0;

                // убираем debugger из продакшн-кода, оставляем только в разработке
                if (DEBUG && !success) {
                    console.debug(
                        'XPopup Image: load check failed for',
                        imgSrc,
                        'complete:',
                        winData.$img && winData.$img[0].complete,
                        'width:',
                        winData.$img && winData.$img[0].width,
                    );
                }

                const tmplData = {
                    src: imgSrc,
                    href: imgSrc,
                    title: title || '',
                    text: '',
                    displayTitle: displayTitle,
                };

                if (success) {
                    if (winData.$img) {
                        winData.$img.off('.xpopup_loader');
                    }
                    const $template = $(xpopupUtils.renderTemplate(winData.opts.markup, tmplData));

                    $template.find('.b-xpopup-action').xpopup();
                    winData.opts.html = $template;

                    //Just apply new content. Do not rebuild window options.
                    // plugin.getWindowCtrl().renderContent();
                    successCallback(winData);
                } else {
                    // if image complete check fails 100 times (20 sec), we assume that there was an error.
                    const errMsg = xpopupUtils.renderTemplate(winData.opts.tError, {
                        url: winData.opts.content,
                    });

                    console.warn('XPopup Image Error:', errMsg);

                    // plugin.getWindowCtrl().setWindowStatus('error', errMsg);
                    //Just apply new content. Do not rebuild window options.
                    tmplData.text = errMsg;
                    const content = xpopupUtils.renderTemplate(winData.opts.markup, tmplData);

                    winData.opts.html = content;

                    // plugin.getWindowCtrl().renderContent();
                    errorCallback(winData, errMsg);
                }
            };

            // проверяем кеш перед установкой src
            // Если изображение в кеше — onLoadHandler вызовется сразу (синхронно)
            const loadedFromCache = this._tryLoadFromCache(winData, imgSrc, img);

            winData.$img
                .on('load.xpopup_loader', onLoadHandler) //В случае успеха сработает 'load' event
                .on('error.xpopup_loader', onLoadHandler); //В случае ошибки сработает 'error' event

            // Если изображение не из кеша — запускаем загрузку установкой src
            if (!loadedFromCache) {
                winData.$img.attr('src', imgSrc);
            }
        }

        // renderContent() {
        //     if (DEBUG) console.debug('XpopupImageContent.renderContent called');

        //     const plugin = this;
        //     const st = this.getStorage();
        //     const winData = st.getBoxWindow();

        //     plugin.getWindowCtrl().setWindowStatus('ready');

        //     if (winData.$img) {
        //         winData.$img.remove();
        //         winData.$img = null;
        //     }

        //     // не очищаем кеш галереи при рендере,
        //     // чтобы при переключении изображения использовать предзагруженные данные.
        //     // Кеш будет очищен при закрытии окна.
        // }
    }
    $.xpopup.registerPlugin('content_type.image', new XpopupImageContent());

    /**
     * IFRAME content source plugin
     */
    class XpopupIframeContent {
        constructor() {
            this.defaults = {
                skin: 'lite',
                skinMod: 'no-border',
                width: '100%',
                // maxWidth: '992px',
                maxHeight: '100%',
                minHeight: '80%',
                sizeMode: 'strict',

                markup: `
          <iframe src="{src}" class="b-xpopup__size-holder" frameborder="0" allowfullscreen></iframe>
        `,
            };

            this._emptyPage = '//about:blank';
        }

        _fixIframeBugs(isShowing) {
            const st = this.getStorage();
            const winData = st.getBoxWindow();

            const template = $(winData.opts.markup);
            const el = template.find('iframe');
            if (el.length) {
                // reset src after the popup is closed to avoid "video keeps playing after popup is closed" bug
                if (!isShowing) {
                    el[0].src = this._emptyPage;
                }
            }
        }

        /**
         * Handler of event 'window_change_before'
         */
        onWindowChangeBefore() {
            this._fixIframeBugs(true); // iframe is showing
        }

        /**
         * Handler of event 'window_box_close_after'
         */
        onBoxCloseAfter() {
            this._fixIframeBugs(); // iframe if removed
        }

        /**
         * Handler of event 'window_loading'
         */
        onWindowLoading() {
            const plugin = this;

            plugin.getWindowCtrl().setWindowStatus('loading');
        }

        fetchAndBuildContent(successCallback, errorCallback) {
            // const plugin = this;
            const st = this.getStorage();
            const winData = st.getBoxNewWindow();

            // plugin.getWindowCtrl().setWindowStatus('loading');

            if (!winData.opts.content && winData.triggerEl) {
                winData.opts.content = winData.triggerEl.getAttribute('href');
            }
            if (!winData.opts.headerCaption && winData.triggerEl) {
                winData.opts.headerCaption = winData.triggerEl.getAttribute('title');
            }

            const embedSrc = winData.opts.content;

            const $template = $(xpopupUtils.renderTemplate(winData.opts.markup, { src: embedSrc }));

            winData.opts.html = $template;

            // plugin.getWindowCtrl().setWindowStatus('updating');
            //Just apply new content. Do not rebuild result window options
            // plugin.getWindowCtrl().renderContent();
            successCallback(winData);
        }

        // renderContent() {
        //     const plugin = this;

        //     // plugin.getWindowCtrl().setContent(winData.opts.html,'iframe');
        //     plugin.getWindowCtrl().setWindowStatus('ready');
        // }
    }

    $.xpopup.registerPlugin('content_type.iframe', new XpopupIframeContent());

    /**
     * Fotorama integration plugin
     *
     * Обеспечивает более тесную интеграцию xpopup с плагином fotorama.
     * На данный момент решает следующие задачи:
     * - при выходе по клавише  Esc из fullscreen-режима плагина fotorama предотвращает закрытие
     *   окна xpopup, в котором отображается галерея fotorama. Без этого плагина закрытие xpopup происходит
     *   потому, что xpopup также "следит" за нажатием Esc и закрывает окно в случае её нажатия.
     */
    class XpopupFotoramaContent {
        constructor() {
            this.fotorameFullScreenTimeout = 1000; //Время, через которое после события 'fotorama:fullscreenexit' флаг fullscreen в настройках xpopup будет установлен в false
            this.fotoramaContainerSel = '.b-xalbum-page-viewer';
        }

        /**
         * Handler of event 'window_window_ready'
         */
        onWindowReady() {
            const plugin = this;
            const st = this.getStorage();
            const winData = st.getBoxWindow();
            const el = st.getElements();

            //fotorama integration
            el.$box
                .find(plugin.fotoramaContainerSel)
                .on('fotorama:fullscreenenter', function () {
                    //Установим флаг, что мы fullscreen режиме. В этом случае Esc не закрывает xpopup.
                    winData.isFullScreen = true;
                })
                .on('fotorama:fullscreenexit', function () {
                    //Снимем флаг fullscreen режима, но не сразу, а через fotorameFullScreenTimeout.
                    //Только после этого Esc снова сможет закрывать xpopup
                    setTimeout(function () {
                        winData.isFullScreen = false;
                    }, plugin.fotorameFullScreenTimeout);
                });
        }
    }
    $.xpopup.registerPlugin('custom.fotorama', new XpopupFotoramaContent());
})(jQuery);
