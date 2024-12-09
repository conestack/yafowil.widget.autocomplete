import $ from 'jquery';
import { AutocompleteWidget as BaseAutocomplete } from '../default/widget.js';
import { AutocompleteSuggestion as BaseAutocompleteSuggestion } from '../default/widget.js';

export class AutocompleteSuggestion extends BaseAutocompleteSuggestion {

    /**
     * @param {AutocompleteWidget} widget - The parent widget instance.
     * @param {string} source - The suggestion source text.
     * @param {string} val - The current input value to match.
     */
    constructor(widget, source, val) {
        super(widget, source, val);
    }

    /**
     * Compiles and renders the suggestion element with highlighted match.
     */
    compile() {
        let index = this.value.toUpperCase().indexOf(this.val.toUpperCase());
        this.elem = $('<div />')
            .addClass('autocomplete-suggestion list-group-item')
            .appendTo(this.widget.ul_elem);
        $('<span />')
            .text(this.value.substring(0, index))
            .appendTo(this.elem);
        $('<strong />')
            .text(this.value.substring(index, index + this.val.length))
            .appendTo(this.elem);
        $('<span />')
            .text(this.value.substring(index + this.val.length))
            .appendTo(this.elem);
    }
}

export class AutocompleteWidget extends BaseAutocomplete {

    /**
     * Initializes each widget in the given DOM context.
     * 
     * @param {HTMLElement} context - DOM context for initialization.
     */
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

    /**
     * @param {jQuery} elem - autocomplete input element.
     */
    constructor(elem) {
        super(elem);
        this.Suggestion = AutocompleteSuggestion;
    }

    /**
     * Compiles the necessary HTML structure.
     */
    compile() {
        this.input_elem = $('input.autocomplete', this.elem)
            .attr('spellcheck', false)
            .attr('autocomplete', 'off');
        this.dd_elem = $('<div />')
            .addClass('autocomplete-dropdown card shadow')
            .appendTo('body');
        this.ul_elem = $('<ul />')
            .addClass('list-group list-group-flush')
            .appendTo(this.dd_elem);
        this.no_results = $('<div />')
            .hide()
            .addClass('no-results px-3 py-2')
            .text('No results found.')
            .appendTo(this.dd_elem);
    }

    autocomplete() {
        this.no_results.hide();
        let val = this.input_elem.val();
        this.source({term: val}, (data) => {
            if (!Array.isArray(data)) {
                throw 'yafowil.widget.autocomplete: invalid datatype, data must ' +
                      'be array of strings or {key: value} objects'
            }
            if (!data.length) {
                this.no_results.show();
            } else {
                for (let item of data) {
                    this.suggestions.push(new this.Suggestion(this, item, val));
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

    /**
     * Handles input events, resets suggestions, and triggers autocomplete.
     * 
     * @param {Event} e - Input event triggered by typing.
     */
    on_input(e) {
        clearTimeout(this.timeout);
        this.ul_elem.empty();
        this.dd_elem.hide();
        this.suggestions = [];
        this.current_focus = -1;

        if (this.input_elem.val().length >= this.min_length) {
            this.timeout = setTimeout(this.autocomplete, this.delay);
        }
    }
}

////////////////////////////////////////////////////////////////////////////////
// yafowil.widget.array integration
////////////////////////////////////////////////////////////////////////////////

/**
 * Re-initializes widget on array add event.
 */
function autocomplete_on_array_add(inst, context) {
    AutocompleteWidget.initialize(context);
}

/**
 * Registers subscribers to yafowil array events.
 */
export function register_array_subscribers() {
    if (window.yafowil_array !== undefined) {
        window.yafowil_array.on_array_event('on_add', autocomplete_on_array_add);
    } else if (yafowil.array !== undefined) {
        $.extend(yafowil.array.hooks.add, {
            autocomplete_binder: AutocompleteWidget.initialize
        });
    }
}
