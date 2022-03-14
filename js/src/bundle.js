import $ from 'jquery';

import {AutocompleteWidget} from './widget.js';

export * from './widget.js';

$(function() {
    if (window.ts !== undefined) {
        ts.ajax.register(AutocompleteWidget.initialize, true);
    } else if (window.bdajax !== undefined) {
        bdajax.register(AutocompleteWidget.initialize, true);
    } else {
        AutocompleteWidget.initialize();
    }
});
