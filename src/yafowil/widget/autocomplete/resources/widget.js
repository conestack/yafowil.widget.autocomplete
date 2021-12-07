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
            this.input = $('input.autocomplete', this.elem).attr('spellcheck', false);
            this.ac_params = $('.autocomplete-params', this.elem);
            this.ac_source = $('.autocomplete-source', this.elem);
            this.dd = $(`<div />`).addClass('autocomplete-dropdown');
            this.elem.append(this.dd);
            this.params = [];
            this.suggestions = [];
            this.currentFocus = 0;
            this.init();
            this.autocomplete_input = this.autocomplete_input.bind(this);
            this.input.off('input', this.autocomplete_input).on('input', this.autocomplete_input);
            this.hide_dropdown = this.hide_dropdown.bind(this);
            this.show_dropdown = this.show_dropdown.bind(this);
            this.input.on('focusout', this.hide_dropdown).on('focus', this.show_dropdown);
            this.keydown = this.keydown.bind(this);
            this.input.on('keydown', this.keydown);
        }
        unload() {
            this.input
                .off('input', this.autocomplete_input)
                .off('focusout', this.hide_dropdown)
                .off('focus', this.show_dropdown)
                .off('keydown', this.keydown);
        }
        init() {
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
            } else if (sourcetype === 'remote') {
                params.source = this.get_json(params.source);
            }
            this.params = params;
        }
        get_json(url) {
            let items = [];
            $.getJSON(url, function(data) {
                $.each(data, function( key, val) {
                  items.push(val);
                });
            });
            return items;
        }
        autocomplete_input(e) {
            this.dd.empty().hide();
            this.suggestions = [];
            let val = this.input.val();
            let par = this.params.source;
            if (!val) { return false;}
            this.currentFocus = -1;
            for (let i = 0; i < par.length; i++) {
                if (par[i].substr(0, val.length).toUpperCase() === val.toUpperCase()) {
                    this.dd.show();
                    this.suggestions.push(new Suggestion(this, par[i], val));
                }
            }
        }
        keydown(e) {
            if (e.key === "ArrowDown") {
                this.currentFocus++;
                this.add_active();
            } else if (e.key === "ArrowUp") {
                this.currentFocus--;
                this.add_active();
            } else if (e.key === "Enter") {
                e.preventDefault();
                if (this.currentFocus > -1) {
                    this.suggestions[this.currentFocus].select();
                }
            }
        }
        add_active() {
            for (let suggestion of this.suggestions) {
                suggestion.elem.removeClass('active');
            }
            if (this.currentFocus >= this.suggestions.length) this.currentFocus = 0;
            if (this.currentFocus < 0) this.currentFocus = (this.suggestions.length - 1);
            this.suggestions[this.currentFocus].elem.addClass('active');
        }
        hide_dropdown() {
            this.dd.hide();
        }
        show_dropdown() {
            this.autocomplete_input();
            if (this.suggestions.length !== 0) {
                this.dd.show();
            }
        }
    }
    class Suggestion {
        constructor(ac_widget, value, val) {
            this.ac_widget = ac_widget;
            this.elem = $('<div />').addClass('suggestion');
            this.selected = $(`<strong />`).text(val.substr(0, val.length));
            this.rest = $(`<span />`).text(value.substr(val.length, value.length));
            console.log(value.substr(value.length));
            this.hidden = $(`<input type="hidden" />`).val(value);
            this.elem.append(this.selected).append(this.rest);
            this.ac_widget.dd.append(this.elem).append(this.hidden);
            this.select = this.select.bind(this);
        }
        select() {
            this.ac_widget.input.val(this.hidden.val());
            this.ac_widget.hide_dropdown();
            this.ac_widget.input.blur();
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
    exports.Suggestion = Suggestion;

    Object.defineProperty(exports, '__esModule', { value: true });


    if (window.yafowil === undefined) {
        window.yafowil = {};
    }

    window.yafowil.autocomplete = exports;


    return exports;

})({}, jQuery);
//# sourceMappingURL=widget.js.map
