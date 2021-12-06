(function (exports, $) {
    'use strict';

    class AutocompleteWidget {
        static initialize(context) {
            $('div.yafowil-widget-autocomplete', context).each(function() {
                let elem = $(this);
                new AutocompleteWidget(elem);
            });
        }
        constructor(elem) {
            this.elem = elem;
            this.input = $('input.autocomplete', this).attr('spellcheck', false);
            this.ac_params = $('.autocomplete-params', this.elem);
            this.ac_source = $('.autocomplete-source', this.elem);
            let dd = this.dd = $(`<div />`).addClass('autocomplete-dropdown');
            this.elem.append(dd);
            this.params = [];
            this.currentFocus = 0;
            this.binder();
            this.autocomplete = this.autocomplete.bind(this);
            this.input.on('input', this.autocomplete);
        }
        binder() {
            let rawparams = this.ac_params
                .text()
                .split('|');
            let params = [],
                idx,
                sourcetype;
            for (idx=0; idx < rawparams.length; idx++) {
                let pair = rawparams[idx].split(',');
                let value = pair[1].replace(/^\s+|\s+$/g, "");
                if (!isNaN(value)) {
                    value = parseInt(value);
                }
                if (value === 'True') {
                    value = true;
                }
                if (value === 'False') {
                    value = false;
                }
                var key = pair[0].replace(/^\s+|\s+$/g, "");
                if (key === 'type') {
                    sourcetype = value;
                } else {
                    params[key] = value;
                }
            }
            let source = this.ac_source.text();
            if (source.indexOf('javascript:') === 0) {
                source = source.substring(11, source.length);
                source = source.split('.');
                if (!source.length) {
                    throw "No source path found.";
                }
                let ctx = window;
                let name;
                for (idx in source) {
                    name = source[idx];
                    if (ctx[name] === undefined) {
                        throw "'" + name + "' not found.";
                    }
                    ctx = ctx[name];
                }
                source = ctx;
            }
            params.source = source;
            if (sourcetype === 'local') {
                params.source = params.source.split('|');
            }
            this.params = params;
        }
        autocomplete() {
            console.log(this.params);
            let val = this.input.val();
            if (!val) { return false;}
            this.currentFocus = -1;
            a = document.createElement("DIV");
            a.setAttribute("id", this.id + "autocomplete-list");
            a.setAttribute("class", "autocomplete-items");
            this.parentNode.appendChild(a);
            for (i = 0; i < arr.length; i++) {
                if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
                    b = document.createElement("DIV");
                    b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
                    b.innerHTML += arr[i].substr(val.length);
                    b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
                        b.addEventListener("click", function(e) {
                        inp.value = this.getElementsByTagName("input")[0].value;
                        closeAllLists();
                    });
                    a.appendChild(b);
                }
            }
        }
    }

    $(function() {
        if (window.ts !== undefined) {
            ts.ajax.register(AutocompleteWidget.initialize, true);
        } else if (window.bdajax !== undefined) {
            bdajax.register(AutocompleteWidget.initialize, true);
        } else {
            AutocompleteWidget.initialize();
        }
    });

    exports.AutocompleteWidget = AutocompleteWidget;

    Object.defineProperty(exports, '__esModule', { value: true });


    if (window.yafowil === undefined) {
        window.yafowil = {};
    }

    window.yafowil.autocomplete = exports;


    return exports;

})({}, jQuery);
//# sourceMappingURL=widget.js.map
