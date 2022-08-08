var yafowil_autocomplete = (function (exports, $) {
    'use strict';

    class AutocompleteSuggestion {
        constructor(widget, source, term) {
            this.widget = widget;
            this.elem = $('<div />')
                .addClass('autocomplete-suggestion')
                .appendTo(this.widget.dd_elem);
            this.key = (Array.isArray(source)) ? source[0] : null;
            this.value = (Array.isArray(source)) ? source[1] : source;
            let index = this.value.toUpperCase().indexOf(term.toUpperCase());
            $(`<span />`)
                .text(this.value.substring(0, index))
                .appendTo(this.elem);
            $(`<strong />`)
                .text(this.value.substring(index, index + term.length))
                .appendTo(this.elem);
            $(`<span />`)
                .text(this.value.substring(index + term.length))
                .appendTo(this.elem);
            this.selected = false;
            this.select = this.select.bind(this);
            this.elem.off('mousedown', this.select).on('mousedown', this.select);
        }
        get selected() {
            return this._selected;
        }
        set selected(selected) {
            if (selected) {
                this._selected = true;
                this.elem.addClass('selected');
            } else {
                this._selected = false;
                this.elem.removeClass('selected');
            }
        }
        select() {
            this.selected = true;
            this.widget.select_suggestion(this.value, this.key);
        }
    }
    class AutocompleteWidget {
        static initialize(context) {
            $('div.yafowil-widget-autocomplete', context).each(function() {
                new AutocompleteWidget($(this));
            });
        }
        constructor(elem) {
            elem.data('yafowil-autocomplete', this);
            this.elem = elem;
            this.input_elem = $('input.autocomplete-display', this.elem)
                .attr('spellcheck', false)
                .attr('autocomplete', 'off');
            this.hidden_input = $('input.autocomplete', this.elem);
            this.dd_elem = $(`<div />`)
                .addClass('autocomplete-dropdown')
                .appendTo('body');
            this.suggestions = [];
            this.current_focus = 0;
            let options = this.parse_options();
            this.sourcetype = options.type;
            this.dict = options.dictionary;
            this.delay = options.delay;
            this.min_length = options.minLength;
            this.parse_source();
            this.on_input = this.on_input.bind(this);
            this.hide_dropdown = this.hide_dropdown.bind(this);
            this.on_keydown = this.on_keydown.bind(this);
            this.input_elem
                .on('focusout', this.hide_dropdown)
                .on('focus input', this.on_input)
                .on('keydown', this.on_keydown);
            this.autocomplete = this.autocomplete.bind(this);
        }
        unload() {
            clearTimeout(this.timeout);
            this.input_elem
                .off('focusout', this.hide_dropdown)
                .off('focus input', this.on_input)
                .off('keydown', this.on_keydown);
        }
        parse_options() {
            let rawparams = $('.autocomplete-params', this.elem).text().split('|'),
                options = [];
            for (let i = 0; i < rawparams.length; i++) {
                let pair = rawparams[i].split(',');
                let value = pair[1].replace(/^\s+|\s+$/g, "");
                if (!isNaN(value)) {
                    value = parseInt(value);
                } else
                if (value === 'True') {
                    value = true;
                } else
                if (value === 'False') {
                    value = false;
                }
                let key = pair[0].replace(/^\s+|\s+$/g, "");
                options[key] = value;
            }
            return options;
        }
        parse_source() {
            let source = $('.autocomplete-source', this.elem).text();
            if (source.indexOf('javascript:') === 0) {
                let src = source.substring(11, source.length).split('.');
                let window_src = window;
                for (let part of src) {
                    window_src = window_src[part];
                    if (window_src === undefined) {
                        throw new Error('Cannot locate source function: ' + source);
                    }
                }
                this.source = function(request, response) {
                    window_src(request, response);
                };
            } else if (this.sourcetype === 'local') {
                if (source === '') {
                    throw new Error('Local source is empty');
                }
                this.source = function(request, response) {
                    let src = source.split('|'),
                        term = request.term,
                        data;
                    if (this.dict) {
                        data = {};
                        for (let item of src) {
                            item = item.split(':');
                            if (item[1].toUpperCase().indexOf(term.toUpperCase()) > -1) {
                                data[item[0]] = item[1];
                            }
                        }
                        response(data);
                    } else {
                        response(src);
                    }
                };
            } else if (this.sourcetype === 'remote') {
                this.source = function(request, response) {
                    $.ajax({
                        url: source,
                        data: {term: request.term},
                        dataType: "json",
                        success: function(data) {
                            response(data);
                        },
                        error: function() {
                            response([]);
                            throw new Error('Cannot locate JSON at: ' + source);
                        }
                    });
                };
            }
        }
        on_input(e) {
            clearTimeout(this.timeout);
            this.dd_elem.empty().hide();
            this.suggestions = [];
            this.current_focus = -1;
            if (this.input_elem.val().length >= this.min_length) {
                this.timeout = setTimeout(this.autocomplete, this.delay);
            }
        }
        autocomplete() {
            let term = this.input_elem.val();
            this.source({term: term}, (data) => {
                if (data instanceof Array) {
                    if(!data.length) {
                        return;
                    }
                    for (let item of data) {
                        this.suggestions.push(
                            new AutocompleteSuggestion(this, item, term)
                        );
                    }
                } else {
                    let entries = Object.entries(data);
                    if (entries.length === 0) {
                        return;
                    }
                    for (let entry of entries) {
                        this.suggestions.push(new AutocompleteSuggestion(
                            this,
                            entry,
                            term
                        ));
                    }
                }
                let scrolltop = $(document).scrollTop(),
                    input_top = this.elem.offset().top,
                    input_left = this.elem.offset().left,
                    input_height = this.elem.outerHeight(),
                    dd_height = this.dd_elem.outerHeight(),
                    top;
                let viewport_edge = scrolltop + $(window).outerHeight();
                let dd_bottom = input_top + input_height + dd_height;
                if (dd_bottom >= viewport_edge) {
                    top = input_top - dd_height;
                } else {
                    top = input_top + input_height;
                }
                this.dd_elem.css({
                    top: `${top}px`,
                    left: `${input_left}px`
                });
                this.dd_elem.show();
            });
        }
        on_keydown(e) {
            let scrolltop = this.dd_elem.scrollTop();
            switch (e.key) {
                case "ArrowDown":
                    this.current_focus++;
                    this.add_active(true);
                    break;
                case "ArrowUp":
                    this.current_focus--;
                    this.add_active(false);
                    break;
                case "Enter":
                    e.preventDefault();
                    if (this.current_focus > -1) {
                        let selected_elem = this.suggestions[this.current_focus];
                        selected_elem.selected = true;
                        this.select_suggestion(selected_elem.value, selected_elem.key);
                    }
                    this.input_elem.trigger('blur');
                    break;
                case "Escape":
                    this.hide_dropdown();
                    this.input_elem.trigger('blur');
                    break;
                case "Tab":
                    this.hide_dropdown();
                    if (this.current_focus > -1) {
                        let selected_elem = this.suggestions[this.current_focus];
                        this.input_elem.val(selected_elem.key);
                        this.hide_dropdown();
                        this.input_elem.trigger('blur');
                    }
                    break;
                case "PageDown":
                    e.preventDefault();
                    this.dd_elem.scrollTop(scrolltop + this.dd_elem.height());
                    if (this.current_focus > -1) {
                        let index = 0;
                        for (let i in this.suggestions) {
                            let elem = this.suggestions[i].elem;
                            if (elem.offset().top < this.dd_elem.offset().top) {
                                index++;
                            }
                        }
                        this.current_focus = index;
                        let selected_elem = this.suggestions[index];
                        this.unselect_all();
                        selected_elem.selected = true;
                    }
                    break;
                case "PageUp":
                    e.preventDefault();
                    this.dd_elem.scrollTop(scrolltop - this.dd_elem.height());
                    if (this.current_focus > -1) {
                        let index = 0;
                        for (let i in this.suggestions) {
                            let elem = this.suggestions[i].elem;
                            if (elem.offset().top < this.dd_elem.offset().top) {
                                index++;
                            }
                        }
                        this.current_focus = index;
                        let selected_elem = this.suggestions[index];
                        this.unselect_all();
                        selected_elem.selected = true;
                    }
                    break;
            }
        }
        select_suggestion(value, key) {
            this.hide_dropdown();
            this.input_elem.val(value);
            if (key) {
                this.hidden_input.val(key);
            } else {
                this.hidden_input.val(value);
            }
        }
        unselect_all() {
            for (let suggestion of this.suggestions) {
                suggestion.selected = false;
            }
        }
        add_active(dir) {
            if (this.suggestions.length === 0) {
                return;
            }
            this.unselect_all();
            if (this.current_focus >= this.suggestions.length) {
                this.current_focus = 0;
            } else if (this.current_focus < 0) {
                this.current_focus = (this.suggestions.length - 1);
            }
            let active_elem = this.suggestions[this.current_focus];
            active_elem.selected = true;
            let scrolltop = this.dd_elem.scrollTop();
            let elem_top = active_elem.elem.offset().top;
            let elem_height = active_elem.elem.outerHeight();
            let dd_top = this.dd_elem.offset().top;
            let dd_height = this.dd_elem.outerHeight();
            if (dir) {
                if (this.current_focus === 0) {
                    this.dd_elem.scrollTop(0);
                } else if (elem_top + elem_height > dd_top + dd_height) {
                    this.dd_elem.scrollTop(scrolltop + elem_height);
                }
            } else {
                if (this.current_focus >= this.suggestions.length - 1) {
                    this.dd_elem.scrollTop(elem_height * this.suggestions.length);
                } else if (elem_top < dd_top) {
                    this.dd_elem.scrollTop(scrolltop - elem_height);
                }
            }
        }
        hide_dropdown() {
            this.dd_elem.hide();
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
        if (yafowil.array !== undefined) {
            $.extend(yafowil.array.hooks.add, {
                autocomplete_binder: AutocompleteWidget.initialize
            });
        }
    });

    exports.AutocompleteSuggestion = AutocompleteSuggestion;
    exports.AutocompleteWidget = AutocompleteWidget;

    Object.defineProperty(exports, '__esModule', { value: true });


    window.yafowil = window.yafowil || {};
    window.yafowil.autocomplete = exports;


    return exports;

})({}, jQuery);
