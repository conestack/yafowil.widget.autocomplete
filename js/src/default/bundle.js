import $ from 'jquery';
import { AutocompleteWidget, register_array_subscribers } from './widget.js';

export * from './widget.js';

$(() => {
    if (window.ts !== undefined) {
        ts.ajax.register(AutocompleteWidget.initialize, true);
    } else if (window.bdajax !== undefined) {
        bdajax.register(AutocompleteWidget.initialize, true);
    } else {
        AutocompleteWidget.initialize();
    }
    register_array_subscribers();
});
