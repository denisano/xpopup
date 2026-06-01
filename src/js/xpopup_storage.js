(function ($) {
  const xpopupApi = $.xpopup;  
  const DEBUG = xpopupApi.defaults.debug;

  class XpopupStorage {
    constructor() {
      this.activeBoxId = undefined;
      this._boxes = [];
    }

    getElements() {
      const elements = this.getBox().elements;
      return elements;
    }

    clearElements() {
      let boxData = this.getBox();
      //Очистим elements
      //boxData.elements = {}; //так быстрее, но получим проблемы в клиентском коде, ссылающимся на st.getElements()
      Object.keys(boxData.elements).forEach(function (key) {
        delete boxData.elements[key];
      });
    }

    setBoxNewWindow(id) {
      //TODO: add event:
      this.getBox().newWindowId = id;
    }

    getBoxNewWindow() {
      const id = this.getBox().newWindowId;
      const win = this.findBoxWindows({ id: id })[0];
      return win;
    }

    setCurWindow(id) {
      this.getBox().curWindowId = id;
    }

    activateBox(boxId) {
      if (boxId == "new") {
        boxId = this._boxes.length;
      }
      if (typeof boxId == "undefined") {
        if (typeof this.activeBoxId == "undefined") {
          boxId = 1;
        } else {
          boxId = this.activeBoxId;
        }
      }
      let box = this.findBoxById(boxId);
      if (!box) {
        box = {
          id: boxId,
          status: null,
          curWindowId: null,
          elements: {},
          windows: [],
        };
        this._boxes.push(box);
      }
      this.activeBoxId = box.id;
      return this.activeBoxId;
    }

    getBox(boxId) {
      if (typeof boxId == "undefined") {
        boxId = this.activeBoxId;
      }
      let box = this.findBoxById(boxId);
      if (!box)
        box = {
          status: null,
          curWindowId: null,
          elements: {},
          windows: [],
        };
      return box;
    }

    deleteBox() {
      if (DEBUG) console.debug("XpopupStorage.deleteBox called");

      const boxIndex = this.findBoxIndex(this.activeBoxId);
      if (boxIndex != -1) {
        const box = this._boxes[boxIndex];
        this._boxes.splice(boxIndex, 1);

        box.elements.$boxAndBg.remove();
        delete this._boxes[boxIndex];

        if (this._boxes.length > 0) {
          const prevBox = this._boxes[this._boxes.length - 1];
          this.activeBoxId = prevBox.id;
        } else {
          this.activeBoxId = 1;
        }
      }
    }

    findBoxById(id) {
      const index = this.findBoxIndex(id);
      if (index != -1) {
        return this._boxes[index];
      }
      return null;
    }

    findBoxIndex(id) {
      let matchedIndex = -1;
      this._boxes.some(function (item, index) {
        if (item.id == id) {
          matchedIndex = index;
          return true; // выход из цикла
        }
        return false;
      });
      return matchedIndex;
    }

    /**
     * Считает число "используемых" боксов. Бокс считается "используемым", если в нём есть хотя бы одно окно.
     * Если excludeBoxId не пустой, то бокс с таким id исключается из подсчёта.
     *
     * Данная ф-ция используется в обработчике события закрытия окна. Она необходима, чтобы определить
     * следует ли закрывать весь popup.
     *
     * @param  int excludeBoxId [description]
     * @return int             [description]
     */
    countUsableBoxes(excludeBoxId) {
      let n = 0;
      const boxes = this._boxes;
      for (let i = 0; i < boxes.length; i++) {
        const box = boxes[i];
        if (typeof excludeBoxId != "undefined" && box.id == excludeBoxId) {
          continue;
        }
        if (
          box.status != "closed" &&
          box.status != "opening" &&
          box.windows &&
          box.windows.length > 0
        ) {
          n++;
        }
      }
      return n;
    }

    hasOpenBoxes() {
      return this.countUsableBoxes() > 0;
    }

    getWindowIndex(id, boxId) {
      const box = this.getBox(boxId);
      let matchedIndex = -1;

      box.windows.some(function (item, index) {
        if (item.id == id) {
          matchedIndex = index;
          return true; // выход из цикла
        }
        return false;
      });
      return matchedIndex;
    }

    getBoxWindow(id, boxId) {
      if (id == -1) {
        const winData = this.getBoxWindow(null, boxId);
        id = winData ? winData.parentId : null;
      } else {
        id = id || this.getBox(boxId).curWindowId;
      }
      const win = this.findBoxWindows({ id: id }, boxId)[0];
      return win;
    }

    getCurrentWindow() {
      const boxData = this.getBox();
      const id = boxData.curWindowId;
      const win = this.findBoxWindows({ id: id }, boxData.id)[0];
      return win;
    }

    findBoxWindows(filters, boxId) {
      filters = filters || {};
      filters.boxId = this.getBox(boxId).id;
      return this.findWindows(filters);
    }

    findWindows(filters, boxId) {
      const box = this.getBox(boxId);
      if (!filters) {
        return box.windows;
      }

      const matched = [];
      box.windows.forEach(function (item, index) {
        if (filters.opened) {
          return;
        }
        if (filters.id && item.id != filters.id) {
          return;
        }
        if (filters.parentId && item.parentId != filters.parentId) {
          return;
        }

        matched.push(item);
      });

      return matched;
    }

    updateWindow(id, newData) {
      const box = this.getBox();
      const index = this.getWindowIndex(id);
      if (index != -1) {
        const winData = box.windows[index];
        Object.assign(winData, newData);
        return winData;
      }
      return null;
    }

    addWindowToBox(winData) {
      const box = this.getBox();

      //Разберёмся с boxId. Важно, чтобы оно совпадало с box.id.
      if (winData.boxId != box.id) {
        if (winData.autoDetectedOptions) {
          winData.autoDetectedOptions.boxId = box.id;
        } else {
          winData.autoDetectedOptions = { boxId: box.id };
        }
      }
      winData.boxId = winData.opts.boxId = box.id;

      // const prevWinData = this.getBoxWindow();
      const prevWinData = this.getCurrentWindow();
      if (prevWinData && prevWinData.opts.canBeParent) {
        winData.parentId = prevWinData.id;
      }

      let index = -1;
      if (winData.initialState) {
        //если текущее окно = loading, то найдём его, что произвести заменю на окно с новым состоянием
        index = this.getWindowIndex(winData.initialState.id);
        delete winData.initialState;
      }
      if (index < 0) {
        if (winData.id) {
          index = this.getWindowIndex(winData.id);
        }
      }

      // TODO: refactor it
      if (index != -1) {
        //произведем замену временного окна loading
        winData.id = box.windows[index].id;
        box.windows.splice(index, 1, winData);
      } else {
        box.windows.push(winData);
      }

      // this.getBox().curWindowId=winData.id;
      return winData.id;
    }

    removeWindowFromBox(id) {
      const box = this.getBox();
      const index = this.getWindowIndex(id);

      if (index != -1) {
        const winData = box.windows[index];
        winData.boxId = null;
        box.windows.splice(index, 1);
      }

      if (box.windows.length == 0) {
        this.deleteBox();
      }
      return index;
    }
  }
  // Экспортируем класс в глобальную область видимости для использования в других модулях
  window.XpopupStorage = XpopupStorage;
})(jQuery);
