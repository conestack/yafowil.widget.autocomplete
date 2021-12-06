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
        this.ac_params = $('.autocomplete-params', this.elem);
        this.ac_source = $('.autocomplete-source', this.elem);
        let dd = this.dd = $(`<div />`).addClass('autocomplete-dropdown');
        this.elem.append(dd);

        this.params = [];

        this.currentFocus = 0;
        this.binder();

        this.autocomplete_input = this.autocomplete_input.bind(this);
        this.input.off('input', this.autocomplete_input).on('input', this.autocomplete_input);

        this.close_all = this.close_all.bind(this);

        this.keydown = this.keydown.bind(this);
        this.input.on('keydown', this.keydown);

        this.autocomplete_input();
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

    autocomplete_input(e) {
        this.close_all();

        let val = this.input.val();
        let arr = this.params.source;

        if (!val) { return false;}
        this.currentFocus = -1;


        for (let i = 0; i < arr.length; i++) {
            if (arr[i].substr(0, val.length).toUpperCase() === val.toUpperCase()) {
                let sug = $('<span />').addClass('suggestion');
                let selected = $(`<strong>${arr[i].substr(0, val.length)}</strong>`);
                let rest = $(`<span>${arr[i].substr(val.length)}</span>`);
                let hidden = $(`<input type="hidden" />`);

                this.dd.append(sug);
                sug.append(selected);
                sug.append(rest);

                this.dd.append(hidden);
                hidden.val(arr[i]);

                sug.on('click', () => {
                    this.input.val(hidden.val());
                    this.close_all();
                });
            }
        }
    }

    keydown(e) {
        console.log(e.key)
        if (e.key === "ArrowDown") {
            this.currentFocus++;
            this.add_active();
        } else if (e.key === "ArrowUp") {
            this.currentFocus--;
            this.add_active();
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (this.currentFocus > -1) {
                let suggestions = [];
                $('span.suggestion', this.dd).each(function() {
                    suggestions.push($(this));
                });
                suggestions[this.currentFocus].trigger('click');
            }
        }
    }

    add_active() {
        let suggestions = [];
        $('span.suggestion', this.dd).each(function() {
            suggestions.push($(this));
        });
        for (let suggestion of suggestions) {
            suggestion.removeClass('active');
        }
        if (this.currentFocus >= suggestions.length) this.currentFocus = 0;
        if (this.currentFocus < 0) this.currentFocus = (suggestions.length - 1);
        suggestions[this.currentFocus].addClass('active');
    }

    close_all() {
        this.dd.empty();
    }
}
