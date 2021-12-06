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
        this.input = $('input.autocomplete', this).attr('spellcheck', false);
        this.ac_params = $('.autocomplete-params', this.elem);
        this.ac_source = $('.autocomplete-source', this.elem);
        let dd = this.dd = $(`<div />`).addClass('autocomplete-dropdown');
        this.elem.append(dd);

        this.params = [];

        this.currentFocus = 0;
        this.binder();

        this.autocomplete = this.autocomplete.bind(this);
        this.input.on('input', this.autocomplete);
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

    autocomplete() {
        console.log(this.params)

        let val = this.input.val();

        if (!val) { return false;}
        this.currentFocus = -1;


        /*create a DIV element that will contain the items (values):*/
        a = document.createElement("DIV");
        a.setAttribute("id", this.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");


        /*append the DIV element as a child of the autocomplete container:*/
        this.parentNode.appendChild(a);


        /*for each item in the array...*/
        for (i = 0; i < arr.length; i++) {

            /*check if the item starts with the same letters as the text field value:*/
            if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
                /*create a DIV element for each matching element:*/
                b = document.createElement("DIV");
                /*make the matching letters bold:*/
                b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
                b.innerHTML += arr[i].substr(val.length);
                /*insert a input field that will hold the current array item's value:*/
                b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
                /*execute a function when someone clicks on the item value (DIV element):*/
                    b.addEventListener("click", function(e) {
                    /*insert the value for the autocomplete text field:*/
                    inp.value = this.getElementsByTagName("input")[0].value;
                    /*close the list of autocompleted values,
                    (or any other open lists of autocompleted values:*/
                    closeAllLists();
                });
                a.appendChild(b);
            }
        }
    }
}
