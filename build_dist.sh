#!/bin/sh

uglifyjs --compress --mangle --output dist/js/jquery.xpopup.min.js -- src/js/jquery.xpopup.js src/js/xpopup_utils.js src/js/xpopup_storage.js src/js/xpopup_window_ctrl.js src/js/xpopup_types.js src/js/xpopup_autorun.js

cat banner.txt dist/js/jquery.xpopup.min.js > dist/js/jquery.xpopup.min.js.tmp && mv -f dist/js/jquery.xpopup.min.js.tmp  dist/js/jquery.xpopup.min.js


uglifycss src/css/xpopup.css src/css/xpopup-skins.css > dist/css/xpopup.min.css

cat banner.txt dist/css/xpopup.min.css > dist/css/xpopup.min.css.tmp && mv -f dist/css/xpopup.min.css.tmp  dist/css/xpopup.min.css
