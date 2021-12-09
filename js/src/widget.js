import $ from 'jquery';

export class AutocompleteWidget {

    static initialize(context) {
        $('div.yafowil-widget-autocomplete', context).each(function() {
            new AutocompleteWidget($(this));
        });
    }

    constructor(elem) {
        this.elem = elem;
        this.input = $('input.autocomplete', this.elem).attr('spellcheck', false);
        this.dd = $(`<div />`).addClass('autocomplete-dropdown');
        this.elem.append(this.dd);

        this.suggestions = [];
        this.current_focus = 0;

        this.options = this.parse_options();
        this.sourcetype = this.options.type;
        this.source = this.options.source;
        this.delay = this.options.delay;
        this.min_length = this.options.minLength;

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
            if (!isNaN(value)) value = parseInt(value);
            if (value === 'True') value = true;
            if (value === 'False') value = false;
            let key = pair[0].replace(/^\s+|\s+$/g, "");
            options[key] = value;
        }

        let source = $('.autocomplete-source', this.elem).text();
        if (source.indexOf('javascript:') === 0) {
            options.source = source.substring(11, source.length).split('.');
        } else if (options.type === 'local') {
            options.source = source.split('|');
        } else if (options.type === 'remote') {
            options.source = source;
        }

        return options;
    }

    input_handle(e) {
        clearTimeout(this.timeout);
        this.dd.empty().hide();
        this.suggestions = [];
        this.current_focus = -1;

        if (this.input.val().length < this.min_length) return;
        this.timeout = setTimeout(this.autocomplete, this.delay);
    }

    autocomplete() {
        let src = this.source;
        let val = this.input.val();

        if (this.sourcetype === "remote") {
            $.getJSON(src).done((data) => {
                for (let item of data) {
                    if (item.substr(0, val.length).toUpperCase() === val.toUpperCase()) {
                        this.dd.show();
                        this.suggestions.push(new Suggestion(this, item, val));
                    }
                }
            });
        } else {
            for (let i = 0; i < src.length; i++) {
                this.dd.show();
                if (src[i].substr(0, val.length).toUpperCase() === val.toUpperCase()) {
                    this.suggestions.push(new Suggestion(this, src[i], val));
                }
            }
        }
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
        for (let suggestion of this.suggestions) {
            suggestion.elem.removeClass('active');
        }

        if (this.current_focus >= this.suggestions.length) this.current_focus = 0;
        if (this.current_focus < 0) this.current_focus = (this.suggestions.length - 1);
        this.suggestions[this.current_focus].elem.addClass('active');
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

export class Suggestion {
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