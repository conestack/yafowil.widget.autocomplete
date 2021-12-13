import $ from 'jquery';

export class AutocompleteSuggestion {
    constructor(widget, source, val) {
        this.widget = widget;

        this.elem = $('<div />').addClass('autocomplete-suggestion');

        this.selected_elem = $(`<strong />`).text(val.substr(0, val.length));
        this.rest_elem = $(`<span />`).text(source.substr(val.length, source.length));
        this.value = source;

        this.elem.append(this.selected_elem).append(this.rest_elem);
        this.widget.dd_elem.append(this.elem);

        this.select = this.select.bind(this);
        this.elem.off('mousedown', this.select).on('mousedown', this.select);
    }

    select() {
        this.widget.input_elem.val(this.value);
        this.widget.hide_dropdown();
        this.widget.input_elem.blur();
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
        this.show_dropdown = this.show_dropdown.bind(this);
        this.input_elem
            .on('focusout', this.hide_dropdown)
            .on('focus', this.show_dropdown);

        this.keydown_handle = this.keydown_handle.bind(this);
        this.input_elem.on('keydown', this.keydown_handle);

        this.autocomplete = this.autocomplete.bind(this);
    }

    unload() {
        clearTimeout(this.timeout);
        this.input_elem
            .off('input', this.input_handle)
            .off('focusout', this.hide_dropdown)
            .off('focus', this.show_dropdown)
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
        return options;
    }

    parse_source() {
        let source = $('.autocomplete-source', this.elem).text();

        if (source.indexOf('javascript:') === 0) {
            source = source.substring(11, source.length).split('.');
            this.source = window[source[0]][source[1]];
        } else if (this.sourcetype === 'local') {
            this.source = function(request, response) {
                let src = source.split('|'),
                    term = request.term,
                    data = [];
                for (let item of src) {
                    if (
                        ///////////
                        item.substr(0, term.length).toUpperCase() ===
                        term.toUpperCase()
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
            suggestion.elem.removeClass('selected');
        }

        if (this.current_focus >= this.suggestions.length) {
            this.current_focus = 0;
        } else if (this.current_focus < 0) {
            this.current_focus = (this.suggestions.length - 1);
        }
        let active_elem = this.suggestions[this.current_focus].elem;
        active_elem.addClass('selected');
        $('html,body').animate({scrollTop: active_elem.offset().top});
    }

    hide_dropdown() {
        this.dd_elem.hide();
    }

    show_dropdown() {
        this.input_handle();
        if (this.suggestions.length !== 0) {
            this.dd_elem.show();
        }
    }
}
