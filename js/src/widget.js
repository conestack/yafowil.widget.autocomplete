import $ from 'jquery';

export class AutocompleteSuggestion {
    constructor(widget, source, val) {
        this.widget = widget;

        this.elem = $('<div />').addClass('autocomplete-suggestion');

        let index = source.toUpperCase().indexOf(val.toUpperCase());
        this.start_elem = $(`<span />`)
            .text(source.substring(0, index));
        this.selected_elem = $(`<strong />`)
            .text(source.substring(index, index + val.length));
        this.end_elem = $(`<span />`)
            .text(source.substring(index + val.length));
        this.value = source;
        this.selected = false;

        this.elem
            .append(this.start_elem)
            .append(this.selected_elem)
            .append(this.end_elem);
        this.widget.dd_elem.append(this.elem);

        this.select = this.select.bind(this);
        this.elem.off('mousedown', this.select).on('mousedown', this.select);
    }

    get selected() {
        return this._selected;
    }

    set selected(selected) {
        if (selected === true) {
            this._selected = true;
            this.elem.addClass('selected');
        } else if (selected === false) {
            this._selected = false;
            this.elem.removeClass('selected');
        }
    }

    select() {
        this.selected = true;
        this.widget.select_suggestion(this.value);
    }
}

export class AutocompleteWidget {

    static initialize(context) {
        $('div.yafowil-widget-autocomplete', context).each(function() {
            new AutocompleteWidget($(this));
        });
    }

    constructor(elem) {
        this.elem = elem;
        this.elem.data('autocomplete', this);
        this.input_elem = $('input.autocomplete', this.elem)
            .attr('spellcheck', false)
            .attr('autocomplete', false);
        this.dd_elem = $(`<div />`).addClass('autocomplete-dropdown');
        this.elem.append(this.dd_elem);

        this.suggestions = [];
        this.current_focus = 0;

        let options = this.parse_options();
        this.sourcetype = options.type;
        this.delay = options.delay;
        this.min_length = options.minLength;

        this.parse_source();

        this.input_handle = this.input_handle.bind(this);
        this.input_elem
            .off('input', this.input_handle)
            .on('input', this.input_handle);

        this.hide_dropdown = this.hide_dropdown.bind(this);

        this.input_elem
            .on('focusout', this.hide_dropdown)
            .on('focus', this.input_handle);

        this.keydown_handle = this.keydown_handle.bind(this);
        this.input_elem.on('keydown', this.keydown_handle);

        this.autocomplete = this.autocomplete.bind(this);
    }

    unload() {
        clearTimeout(this.timeout);
        this.input_elem
            .off('input', this.input_handle)
            .off('focusout', this.hide_dropdown)
            .off('focus', this.input_handle)
            .off('keydown', this.keydown_handle);
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
                    if (
                        item.toUpperCase().indexOf(term.toUpperCase()) > -1
                    ) {
                        data.push(item);
                    }
                }
                response(data);
            }
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
            }
        }
    }

    input_handle(e) {
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
            for (let item of data) {
                this.dd_elem.show();
                this.suggestions.push(new AutocompleteSuggestion(this, item, val));
            }
        });
    }

    keydown_handle(e) {
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
                    this.input_elem.val(selected_elem.value);
                    this.hide_dropdown();
                    this.input_elem.blur();
                }
                break;

            case "Escape":
                this.hide_dropdown();
                this.input_elem.blur();
                break;

            case "Tab":
                this.hide_dropdown();
                if (this.current_focus > -1) {
                    let selected_elem = this.suggestions[this.current_focus];
                    this.input_elem.val(selected_elem.value);
                    this.hide_dropdown();
                    this.input_elem.blur();
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

    select_suggestion(val) {
        this.hide_dropdown();
        this.input_elem.val(val);
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
        // $('html,body').animate({scrollTop: active_elem.elem.offset().top});
    }

    hide_dropdown() {
        this.dd_elem.hide();
    }
}
