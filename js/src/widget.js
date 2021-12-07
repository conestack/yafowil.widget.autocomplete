import $ from 'jquery';

export class AutocompleteWidget {

    static initialize(context) {
        $('div.yafowil-widget-autocomplete', context).each(function() {
            let elem = $(this);
            new AutocompleteWidget(elem);
        });
    }

    constructor(elem) {
        this.elem = elem;
        this.input = $('input.autocomplete', this.elem).attr('spellcheck', false);
        this.dd = $(`<div />`).addClass('autocomplete-dropdown');
        this.elem.append(this.dd);

        this.suggestions = [];
        this.current_focus = 0;

        let rawparams = $('.autocomplete-params', this.elem).text().split('|');
        this.params = rawparams;

        let source = $('.autocomplete-source', this.elem).text();
        this.source = source;

        this.autocomplete_input = this.autocomplete_input.bind(this);
        this.input
            .off('input', this.autocomplete_input)
            .on('input', this.autocomplete_input);

        this.hide_dropdown = this.hide_dropdown.bind(this);
        this.show_dropdown = this.show_dropdown.bind(this);
        this.input
            .on('focusout', this.hide_dropdown)
            .on('focus', this.show_dropdown);

        this.keydown = this.keydown.bind(this);
        this.input.on('keydown', this.keydown);
    }

    get source() {
        return this._source;
    }

    set source(url) {
        if (url.indexOf('javascript:') === 0) {
            url = url.substring(11, url.length).split('.');

            if (!url.length) throw "No source path found.";

            for (let i in url) {
                let name = url[i];
                if (window[name] === undefined) throw "'" + name + "' not found.";
                window = window[name];
            }
            url = window;
        }

        if (this.params.sourcetype === 'local') {
            this._source = url.split('|');
        } else if (this.params.sourcetype === 'remote') {
            this._source = this.get_json(url);
        }
    }

    get params() {
        return this._params;
    }

    set params(rawparams) {
        let params = [];
        for (let i = 0; i < rawparams.length; i++) {
            let pair = rawparams[i].split(',');
            let value = pair[1].replace(/^\s+|\s+$/g, "");
            if (!isNaN(value)) value = parseInt(value);
            if (value === 'True') value = true;
            if (value === 'False') value = false;

            let key = pair[0].replace(/^\s+|\s+$/g, "");
            if (key === 'type') {
                params.sourcetype = value; 
            } else {
                params[key] = value;
            }
        }
        this._params = params;
    }

    unload() {
        this.input
            .off('input', this.autocomplete_input)
            .off('focusout', this.hide_dropdown)
            .off('focus', this.show_dropdown)
            .off('keydown', this.keydown);

        for (let suggestion of this.suggestions) {
            suggestion.unload();
        }
    }

    get_json(url) {
        let items = [];
        $.getJSON(url, function(data) {
            $.each(data, function(key, val) {
              items.push(val);
            });
        });
        return items;
    }

    autocomplete_input(e) {
        this.dd.empty().hide();
        this.suggestions = [];

        let val = this.input.val();
        let src = this.source;

        if (!val) { return false;}
        this.current_focus = -1;

        for (let i = 0; i < src.length; i++) {
            if (src[i].substr(0, val.length).toUpperCase() === val.toUpperCase()) {
                this.dd.show();
                this.suggestions.push(new Suggestion(this, src[i], val));
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
        this.autocomplete_input();
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