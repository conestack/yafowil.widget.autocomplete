var yafowil_autocomplete = (function (exports, $) {
    'use strict';

    class AutocompleteSuggestion {
        constructor(widget, source, val) {
            this.widget = widget;
            if (($.isPlainObject(source))) {
                this.id = source.id;
                this.value = source.title;
            } else if (typeof source === 'string') {
                this.id = null;
                this.value = source;
            } else {
                throw 'yafowil.widget.autocomplete: Invalid Suggestion type. Suggestion' +
                      'must be string or {key: value} object.'
            }
            this.val = val;
            this.compile();
            this.selected = false;
            this.select = this.select.bind(this);
            this.elem.off('mousedown', this.select).on('mousedown', this.select);
        }
        compile() {
            let index = this.value.toUpperCase().indexOf(this.val.toUpperCase());
            this.elem = $('<div />')
                .addClass('autocomplete-suggestion')
                .appendTo(this.widget.dd_elem);
            $(`<span />`)
                .text(this.value.substring(0, index))
                .appendTo(this.elem);
            $(`<strong />`)
                .text(this.value.substring(index, index + this.val.length))
                .appendTo(this.elem);
            $(`<span />`)
                .text(this.value.substring(index + this.val.length))
                .appendTo(this.elem);
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
            this.widget.select_suggestion(this.id, this.value);
        }
    }
    class AutocompleteWidget {
        static initialize(context) {
            $('div.yafowil-widget-autocomplete', context).each(function() {
                let elem = $(this);
                if (window.yafowil_array !== undefined &&
                    window.yafowil_array.inside_template(elem)) {
                    return;
                }
                new AutocompleteWidget(elem);
            });
        }
        constructor(elem) {
            elem.data('yafowil-autocomplete', this);
            this.elem = elem;
            this.result_key_elem = $('input.autocomplete-result-key', elem);
            this.Suggestion = AutocompleteSuggestion;
            this.compile();
            this.suggestions = [];
            this.current_focus = 0;
            let options = this.parse_options();
            this.sourcetype = options.type;
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
        compile() {
            this.input_elem = $('input.autocomplete', this.elem)
                .attr('spellcheck', false)
                .attr('autocomplete', 'off');
            this.dd_elem = $(`<div />`)
                .addClass('autocomplete-dropdown')
                .appendTo('body');
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
                        data = [];
                    for (let item of src) {
                        if (item.toUpperCase().indexOf(term.toUpperCase()) > -1) {
                            data.push(item);
                        }
                    }
                    response(data);
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
            let val = this.input_elem.val();
            this.source({term: val}, (data) => {
                if (!Array.isArray(data)) {
                    throw 'yafowil.widget.autocomplete: invalid datatype, data must ' +
                          'be array of strings or objects'
                }
                if (!data.length) {
                    return;
                }
                for (let item of data) {
                    this.suggestions.push(new this.Suggestion(this, item, val));
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
                        selected_elem.select();
                        this.input_elem.val(selected_elem.value);
                        this.hide_dropdown();
                        this.input_elem.trigger('blur');
                    }
                    break;
                case "Escape":
                    this.hide_dropdown();
                    this.input_elem.trigger('blur');
                    break;
                case "Tab":
                    this.hide_dropdown();
                    if (this.current_focus > -1) {
                        let selected_elem = this.suggestions[this.current_focus];
                        this.input_elem.val(selected_elem.value);
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
                default:
                    this.result_key_elem.val('');
            }
        }
        select_suggestion(key, val) {
            this.hide_dropdown();
            this.input_elem.val(val);
            if (key) {
                this.result_key_elem.val(key);
            }
        }
        unselect_all() {
            this.result_key_elem.val('');
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
    function autocomplete_on_array_add(inst, context) {
        AutocompleteWidget.initialize(context);
    }
    function register_array_subscribers() {
        if (window.yafowil_array !== undefined) {
            window.yafowil_array.on_array_event('on_add', autocomplete_on_array_add);
        } else if (yafowil.array !== undefined) {
            $.extend(yafowil.array.hooks.add, {
                autocomplete_binder: AutocompleteWidget.initialize
            });
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
        register_array_subscribers();
    });

    exports.AutocompleteSuggestion = AutocompleteSuggestion;
    exports.AutocompleteWidget = AutocompleteWidget;
    exports.register_array_subscribers = register_array_subscribers;

    Object.defineProperty(exports, '__esModule', { value: true });


    window.yafowil = window.yafowil || {};
    window.yafowil.autocomplete = exports;


    return exports;

})({}, jQuery);
