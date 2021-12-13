(function (exports, $) {
    'use strict';

    class AutocompleteWidget {
        static initialize(context) {
            $('div.yafowil-widget-autocomplete', context).each(function() {
                new AutocompleteWidget($(this));
            });
        }
        constructor(elem) {
            this.elem = elem;
            this.elem.data('autocomplete', this);
            this.input = $('input.autocomplete', this.elem)
                .attr('spellcheck', false)
                .attr('autocomplete', false);
            this.dd = $(`<div />`).addClass('autocomplete-dropdown');
            this.elem.append(this.dd);
            this.suggestions = [];
            this.current_focus = 0;
            this.parse_options();
            this.parse_source();
            this.input_handle = this.input_handle.bind(this);
            this.input
                .off('input', this.input_handle)
                .on('input', this.input_handle);
            this.hide_dropdown = this.hide_dropdown.bind(this);
            this.show_dropdown = this.show_dropdown.bind(this);
            this.input
                .on('focusout', this.hide_dropdown)
                .on('focus', this.show_dropdown);
            this.keydown = this.keydown.bind(this);
            this.input.on('keydown', this.keydown);
            this.autocomplete = this.autocomplete.bind(this);
        }
        unload() {
            clearTimeout(this.timeout);
            this.input
                .off('input', this.input_handle)
                .off('focusout', this.hide_dropdown)
                .off('focus', this.show_dropdown)
                .off('keydown', this.keydown);
            for (let suggestion of this.suggestions) {
                suggestion.unload();
            }
        }
        parse_options() {
            let rawparams = $('.autocomplete-params', this.elem).text().split('|'),
                options = [];
            for (let i = 0; i < rawparams.length; i++) {
                let pair = rawparams[i].split(',');
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
                let key = pair[0].replace(/^\s+|\s+$/g, "");
                options[key] = value;
            }
            this.sourcetype = options.type;
            this.delay = options.delay;
            this.min_length = options.minLength;
        }
        parse_source() {
            let source = $('.autocomplete-source', this.elem).text();
            if (source.indexOf('javascript:') === 0) {
                source = source.substring(11, source.length).split('.');
                console.log(source);
                this.source = window[source[0]][source[1]];
            } else if (this.sourcetype === 'local') {
                this.source = function(request, response) {
                    let src = source.split('|'),
                        val = request.term,
                        data = [];
                    for (let item of src) {
                        if (
                            item.substr(0, val.length).toUpperCase() ===
                            val.toUpperCase()
                        ) {
                            data.push(item);
                        }
                    }
                    response(data);
                };
            } else if (this.sourcetype === 'remote') {
                this.source = function(request, response) {
                    $.ajax({
                        url: source,
                        data: request,
                        dataType: "json",
                        success: function(data) {
                            response(data);
                        },
                        error: function() {
                            response([]);
                        }
                    });
                };
            }
        }
        input_handle(e) {
            clearTimeout(this.timeout);
            this.dd.empty().hide();
            this.suggestions = [];
            this.current_focus = -1;
            if (this.input.val().length >= this.min_length) {
                this.timeout = setTimeout(this.autocomplete, this.delay);
            }
        }
        autocomplete() {
            let val = this.input.val();
            this.source({term: val}, (data) => {
                for (let item of data) {
                    this.dd.show();
                    this.suggestions.push(new Suggestion(this, item, val));
                }
            });
        }
        keydown(e) {
            if (e.key === "ArrowDown") {
                this.current_focus++;
                this.add_active();
            } else if (e.key === "ArrowUp") {
                this.current_focus--;
                this.add_active();
            } else if (e.key === "Enter") {
                e.preventDefault();
                if (this.current_focus > -1) {
                    this.suggestions[this.current_focus].select();
                }
            }
        }
        add_active() {
            if (this.suggestions.length === 0) {
                return;
            }
            for (let suggestion of this.suggestions) {
                suggestion.elem.removeClass('active');
            }
            if (this.current_focus >= this.suggestions.length) {
                this.current_focus = 0;
            } else if (this.current_focus < 0) {
                this.current_focus = (this.suggestions.length - 1);
            }
            let active_elem = this.suggestions[this.current_focus].elem;
            active_elem.addClass('active');
            $('html,body').animate({scrollTop: active_elem.offset().top});
        }
        hide_dropdown() {
            this.dd.hide();
        }
        show_dropdown() {
            this.input_handle();
            if (this.suggestions.length !== 0) {
                this.dd.show();
            }
        }
    }
    class Suggestion {
        constructor(ac_widget, source, val) {
            this.ac_widget = ac_widget;
            this.elem = $('<div />').addClass('suggestion');
            this.selected = $(`<strong />`).text(val.substr(0, val.length));
            this.rest = $(`<span />`).text(source.substr(val.length, source.length));
            this.value = source;
            this.elem.append(this.selected).append(this.rest);
            this.ac_widget.dd.append(this.elem);
            this.select = this.select.bind(this);
            this.elem.off('mousedown', this.select).on('mousedown', this.select);
        }
        unload() {
            this.elem.off('mousedown', this.select);
        }
        select() {
            this.ac_widget.input.val(this.value);
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
