import {AutocompleteSuggestion, AutocompleteWidget} from '../src/widget.js';

let container = $('<div id="container" />');

////////////////////////////////////////////////////////////////////////////////
// AutocompleteWidget
////////////////////////////////////////////////////////////////////////////////

QUnit.module('AutocompleteWidget', hooks => {
    let elem;
    let widget;
    let arr = "|one|two|three|four|";
    let params = "delay,0|minLength,0|type,local";

    hooks.beforeEach(() => {
        $('body').append(container);
        elem = create_elem(arr, params);
        container.append(elem);
    });
    hooks.afterEach(() => {
        container.empty();
        widget = null;
    });

    QUnit.test('initialize', assert => {
        AutocompleteWidget.initialize();
        widget = elem.data('autocomplete');

        assert.deepEqual(widget.elem, elem);
        assert.ok(widget.input_elem.is('input.autocomplete'));
        assert.ok(widget.dd_elem.is('div.autocomplete-dropdown'));

        assert.ok(widget.parse_options);
        assert.ok(widget.parse_source);

        assert.ok(widget.input_handle);
        assert.ok(widget.hide_dropdown);
        assert.ok(widget.show_dropdown);
        assert.ok(widget.keydown_handle);
        assert.ok(widget.autocomplete);
    });

    QUnit.test('parse_options', assert => {
        AutocompleteWidget.initialize();
        widget = elem.data('autocomplete');
        assert.strictEqual(widget.sourcetype, 'local');
        assert.strictEqual(widget.delay, 0);
        assert.strictEqual(widget.min_length, 0);
    });

    QUnit.module('parse_source()', () => {
        QUnit.test('function 1', assert => {
            $('div.autocomplete-params').text('delay,0|minLength,0');
            window.foo = {
                bar: function(request, response) {
                    response(arr);
                }
            }
            $('div.autocomplete-source').text('javascript:foo.bar');
            AutocompleteWidget.initialize();
            widget = elem.data('autocomplete');
            widget.autocomplete();

            let done = assert.async();
            setTimeout(()=> {
                for (let i in widget.suggestions) {
                    let val = widget.suggestions[i].value;
                    assert.strictEqual(val, arr[i])
                }
                done();
            }, 10);

            window.foo = null;
        });

        QUnit.test('function 2', assert => {
            $('div.autocomplete-params').text('delay,0|minLength,0');
            window.foo = {
                bar: {
                    baz: function(request, response) {
                        response(arr);
                    }
                }
            }
            $('div.autocomplete-source').text('javascript:foo.bar.baz');
            AutocompleteWidget.initialize();
            widget = elem.data('autocomplete');
            widget.autocomplete();

            let done = assert.async();
            setTimeout(()=> {
                for (let i in widget.suggestions) {
                    let val = widget.suggestions[i].value;
                    assert.strictEqual(val, arr[i])
                }
                done();
            }, 10);

            window.foo = null;
        });

        QUnit.test('local', assert => {
            AutocompleteWidget.initialize();
            widget = elem.data('autocomplete');
            assert.strictEqual(widget.sourcetype, 'local');
        });

        QUnit.test('remote', assert => {
            $('div.autocomplete-params').text('delay,300|minLength,1|type,remote');
            AutocompleteWidget.initialize();
            widget = elem.data('autocomplete');
            assert.strictEqual(widget.sourcetype, 'remote');
        });
    });

    QUnit.test('unload', assert => {
        // initialize widget
        AutocompleteWidget.initialize();
        widget = elem.data('autocomplete');

        // dropdown is hidden
        assert.strictEqual(widget.dd_elem.css('display'), 'none');

        // set input value
        widget.input_elem.val('fo');

        // trigger autocomplete to add suggestions
        widget.autocomplete();

        // async operation due to timeout in source code
        let done = assert.async();
        setTimeout(() => {
            // one suggestion has been appended ('four')
            assert.ok(widget.suggestions.length, 1);
            assert.strictEqual(widget.dd_elem.css('display'), 'block');

            // trigger hiding of dropdown
            widget.hide_dropdown();

            // unload widget
            widget.unload();

            // trigger focus event
            widget.input_elem.trigger('focus');
            assert.strictEqual(widget.dd_elem.css('display'), 'none');

            // trigger focusout event
            widget.input_elem.trigger('focusout');
            assert.strictEqual(widget.dd_elem.css('display'), 'none');

            // trigger input event
            widget.input_elem.trigger('input');
            assert.strictEqual(widget.dd_elem.css('display'), 'none');

            // trigger keydown event
            let keydown = new $.Event('keydown', {key:'ArrowDown'});
            widget.input_elem.trigger(keydown);
            assert.strictEqual(widget.dd_elem.css('display'), 'none');

            done();
        }, 10);
    });

    QUnit.module('input_handle()', () => {
        QUnit.test('input', assert => {
            // initialize widget
            AutocompleteWidget.initialize();
            widget = elem.data('autocomplete');
            widget.delay = 300;
            /**
             * trigger('input') does not perfectly trigger a naturally occuring
             * input event, so we append the value manually
             * See: https://api.jquery.com/trigger/
            */
            widget.input_elem.trigger('focus');
            widget.input_elem.val('f');
            widget.input_elem.trigger('input');

            assert.strictEqual(widget.dd_elem.css('display'), 'none');
            assert.strictEqual(widget.suggestions.length, 0);
            assert.strictEqual(widget.current_focus, -1);

            let done = assert.async();

            setTimeout(() => {
                assert.strictEqual(widget.suggestions.length, 1);
                assert.strictEqual(widget.suggestions[0].value, 'four');
                done();
            }, 500);
        });

        QUnit.test('timeout', assert => {
            // initialize widget
            AutocompleteWidget.initialize();
            widget = elem.data('autocomplete');
            widget.delay = 600;

            /**
             * trigger('input') does not perfectly trigger a naturally occuring
             * input event, so we append the value manually
             * See: https://api.jquery.com/trigger/
            */
            widget.input_elem.trigger('focus');
            widget.input_elem.val('f');
            widget.input_elem.trigger('input');

            assert.strictEqual(widget.dd_elem.css('display'), 'none');
            assert.strictEqual(widget.suggestions.length, 0);
            assert.strictEqual(widget.current_focus, -1);

            let done1 = assert.async();
            let done2 = assert.async();

            // autocomplete not triggered yet
            setTimeout(() => {
                assert.strictEqual(widget.suggestions.length, 0);
                done1();
            }, 500);

            // autocomplete has been triggered
            setTimeout(() => {
                assert.strictEqual(widget.suggestions.length, 1);
                assert.strictEqual(widget.suggestions[0].value, 'four');
                done2();
            }, 700);
        });

        QUnit.test('under min length', assert => {
            // initialize widget
            AutocompleteWidget.initialize();
            widget = elem.data('autocomplete');
            widget.min_length = 5;

            /**
             * trigger('input') does not perfectly trigger a naturally occuring
             * input event, so we append the value manually
             * See: https://api.jquery.com/trigger/
            */
            widget.input_elem.trigger('focus');
            widget.input_elem.val('f');
            widget.input_elem.trigger('input');

            assert.strictEqual(widget.dd_elem.css('display'), 'none');
            assert.strictEqual(widget.suggestions.length, 0);
            assert.strictEqual(widget.current_focus, -1);

            let done = assert.async();

            setTimeout(() => {
                assert.strictEqual(widget.suggestions.length, 0);
                done();
            }, 100);
        });
    });

    QUnit.test('autocomplete', assert => {
        // initialize widget
        AutocompleteWidget.initialize();
        widget = elem.data('autocomplete');

        widget.input_elem.trigger('focus');
        widget.input_elem.val('o');
        widget.input_elem.trigger('input');

        let done = assert.async();
        setTimeout(() => {
            let sugs = [];
            for (let sug of widget.suggestions) {
                sugs.push(sug.value);
            }
            assert.strictEqual(sugs[0], 'one');
            assert.strictEqual(sugs[1], 'two');
            assert.strictEqual(sugs[2], 'four');
            done();
        }, 10);
    });

    QUnit.module('keydown_handle()', hooks => {
        let array = ['one', 'two', 'three', 'four', 'five', 'six', 'seven',
        'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'e', 'ee', 'eee'];

        hooks.beforeEach(() => {
            $('div.autocomplete-source').text(array.join('|'));
            // initialize widget
            AutocompleteWidget.initialize();
            widget = elem.data('autocomplete');
        });
        hooks.afterEach(() => {
            container.empty();
            widget = null;
        });

        QUnit.test('ArrowDown', assert => {
            widget.input_elem.trigger('focus');
            widget.input_elem.val('t');
            widget.input_elem.trigger('input');

            let down = new $.Event('keydown', { key: 'ArrowDown' });
            // async operation due to timeout - even if it's 0
            let done = assert.async();
            setTimeout(() => {
                // focus on autocomplete is -1
                assert.strictEqual(widget.current_focus, -1);
                assert.strictEqual(widget.suggestions.length, 6);

                // trigger events for ArrowDown
                for (let i = 0; i < 6; i++) {
                    widget.input_elem.trigger(down);
                    assert.strictEqual(widget.current_focus, i);
                }

                // trigger ArrowDown on last suggestion
                widget.input_elem.trigger(down);
                // focus reset to 0
                assert.strictEqual(widget.current_focus, 0);
                done();
            }, 100);
        });

        QUnit.test('ArrowUp', assert => {
            widget.input_elem.trigger('focus');
            widget.input_elem.val('t');
            widget.input_elem.trigger('input');

            let up = new $.Event('keydown', { key: 'ArrowUp' });
            // async operation due to timeout - even if it's 0
            let done = assert.async();
            setTimeout(() => {
                // focus on autocomplete is -1
                assert.strictEqual(widget.current_focus, -1);
                assert.strictEqual(widget.suggestions.length, 6);

                // trigger ArrowUp on first suggestion
                widget.input_elem.trigger(up);
                // focus reset to 5
                assert.strictEqual(widget.current_focus, 5);

                // trigger events for ArrowUp
                for (let i = 4; i > 0; i--) {
                    widget.input_elem.trigger(up);
                    assert.strictEqual(widget.current_focus, i);
                }
                done();
            }, 100);
        });

        QUnit.test('Enter', assert => {
            let down = new $.Event('keydown', { key: 'ArrowDown' });
            let enter = new $.Event('keydown', {key: 'Enter'});
            widget.input_elem.trigger('focus');
            widget.input_elem.val('t');
            widget.input_elem.trigger('input');

            // async operation due to timeout - even if it's 0
            let done = assert.async();
            setTimeout(() => {
                // focus on autocomplete is -1
                assert.strictEqual(widget.current_focus, -1);
                assert.strictEqual(widget.suggestions.length, 6);

                // trigger Enter key
                widget.input_elem.trigger(enter);
                assert.strictEqual(widget.current_focus, -1);
                // trigger ArrowDown key
                widget.input_elem.trigger(down);
                assert.strictEqual(widget.current_focus, 0);
                // trigger Enter key
                widget.input_elem.trigger(enter);
                assert.strictEqual(widget.input_elem.val(), widget.suggestions[0].value);
                done();
            }, 10);
        });

        QUnit.test('Escape', assert => {
            let escape = new $.Event('keydown', {key: 'Escape'});
            widget.input_elem.trigger('focus');
            widget.input_elem.val('t');
            widget.input_elem.trigger('input');

            // async operation due to timeout - even if it's 0
            let done = assert.async();
            setTimeout(() => {
                // trigger Escape key
                widget.input_elem.trigger(escape);
                assert.strictEqual(widget.current_focus, -1);
                assert.strictEqual(widget.input_elem.val(), 't');
                assert.strictEqual(widget.dd_elem.css('display'), 'none');
                assert.notOk(widget.input_elem.is(':focus'));
                done();
            }, 10);
        });

        QUnit.test('Tab', assert => {
            let down = new $.Event('keydown', { key: 'ArrowDown' });
            let tab = new $.Event('keydown', {key: 'Tab'});

            let dummy_input = $('<input type="text" />');
            dummy_input.appendTo('body');

            widget.input_elem.trigger('focus');
            widget.input_elem.val('t');
            widget.input_elem.trigger('input');

            // async operation due to timeout - even if it's 0
            let done = assert.async();
            setTimeout(() => {
                // trigger ArrowDown key
                widget.input_elem.trigger(down);
                assert.strictEqual(widget.current_focus, 0);
                // trigger Tab key
                widget.input_elem.trigger(tab);
                assert.strictEqual(
                    widget.input_elem.val(),
                    widget.suggestions[0].value
                );
                assert.strictEqual(widget.dd_elem.css('display'), 'none');
                assert.notOk(widget.input_elem.is(':focus'));

                done();
            }, 10);

            dummy_input.remove();
        });

        QUnit.test('PageDown', assert => {
            let down = new $.Event('keydown', { key: 'ArrowDown' });
            let pagedown = new $.Event('keydown', {key: 'PageDown'});

            widget.input_elem.trigger('focus');
            widget.input_elem.val('e');
            widget.input_elem.trigger('input');

            // async operation due to timeout - even if it's 0
            let done = assert.async();
            setTimeout(() => {
                // trigger ArrowDown key
                widget.input_elem.trigger(down);
                assert.strictEqual(widget.current_focus, 0);

                // trigger PageDown key
                widget.input_elem.trigger(pagedown);

                let elem_top = $('.selected').offset().top;
                let dd_top = widget.dd_elem.offset().top;
                assert.ok(elem_top > dd_top);
                done();
            }, 10);
        });

        QUnit.test('PageUp', assert => {
            let down = new $.Event('keydown', { key: 'ArrowDown' });
            let pageup = new $.Event('keydown', {key: 'PageUp'});

            widget.input_elem.trigger('focus');
            widget.input_elem.val('e');
            widget.input_elem.trigger('input');

            // async operation due to timeout - even if it's 0
            let done = assert.async();
            setTimeout(() => {
                // trigger ArrowDown key
                widget.input_elem.trigger(down);
                assert.strictEqual(widget.current_focus, 0);

                // trigger PageUp key
                widget.input_elem.trigger(pageup);

                let elem_top = $('.selected').offset().top;
                let dd_top = widget.dd_elem.offset().top;
                assert.ok(elem_top > dd_top);
                assert.strictEqual(widget.current_focus, 0);
                done();
            }, 10);
        });
    });

    QUnit.test('add_active() with no suggestions', assert => {
        // initialize widget
        AutocompleteWidget.initialize();
        widget = elem.data('autocomplete');
        widget.input_elem.trigger('focus');
        widget.input_elem.val('x');
        widget.input_elem.trigger('input');

        // create events
        let kd = new $.Event('keydown', { key: 'ArrowDown' });

        // async operation due to timeout - even if it's 0
        let done = assert.async();
        setTimeout(() => {
            // no suggestions appended
            assert.strictEqual(widget.suggestions.length, 0);
            widget.input_elem.trigger(kd);
            assert.strictEqual($('div.autocomplete-suggestion.selected').length, 0);
            done();
        }, 10);
    });

    QUnit.test('add_active()', assert => {
        // initialize widget
        AutocompleteWidget.initialize();
        widget = elem.data('autocomplete');
        widget.input_elem.trigger('focus');
        widget.input_elem.val('t');
        widget.input_elem.trigger('input');

        // create events
        let kd = new $.Event('keydown', { key: 'ArrowDown' });

        // async operation due to timeout - even if it's 0
        let done = assert.async();
        setTimeout(() => {
            // five suggestions appended
            assert.strictEqual(widget.suggestions.length, 2);
            widget.input_elem.trigger(kd);
            assert.strictEqual($('div.autocomplete-suggestion.selected').length, 1);
            assert.ok(widget.suggestions[0].elem.hasClass('selected'));
            done();
        }, 10);
    });

    QUnit.test('show_dropdown()', assert => {
        // initialize widget
        AutocompleteWidget.initialize();
        widget = elem.data('autocomplete');

        assert.strictEqual(widget.dd_elem.css('display'), 'none');
        widget.input_elem.val('e');
        widget.input_elem.trigger('input').trigger('focus');

        // async operation due to timeout - even if it's 0
        let done = assert.async();
        setTimeout(() => {
            assert.strictEqual(widget.dd_elem.css('display'), 'block');
            done();
        }, 10);
    });
});

QUnit.module('AutocompleteSuggestion', hooks => {
    let elem;
    let widget;
    let arr = "";
    let params = "delay,0|minLength,0|type,local";
    let sug;

    hooks.beforeEach(() => {
        $('body').append(container);
        elem = create_elem(arr, params);
        container.append(elem);
    });
    hooks.afterEach(() => {
        container.empty();
        widget = null;
        sug = null;
    });

    QUnit.test('constructor', assert => {
        AutocompleteWidget.initialize();
        widget = elem.data('autocomplete');

        sug = new AutocompleteSuggestion(widget, 'foo', 'foo');
        widget.suggestions.push(sug);

        assert.ok(sug.elem.is('div.autocomplete-suggestion'));
        assert.ok(sug.start_elem.is('span'));
        assert.ok(sug.selected_elem.is('strong'));
        assert.ok(sug.end_elem.is('span'));
        assert.ok(sug.elem.parent('div.autocomplete-dropdown'));
        assert.strictEqual(sug.value, 'foo');
    });

    QUnit.test('select()', assert => {
        AutocompleteWidget.initialize();
        widget = elem.data('autocomplete');

        sug = new AutocompleteSuggestion(widget, 'foo', 'foo');
        widget.suggestions.push(sug);

        assert.strictEqual(sug.selected, false);
        assert.notOk(sug.elem.hasClass('selected'));
        sug.selected = true;
        assert.strictEqual(sug.selected, true);
        assert.ok(sug.elem.hasClass('selected'));
        sug.selected = false;
        assert.strictEqual(sug.selected, false);
        assert.notOk(sug.elem.hasClass('selected'));

        sug.elem.trigger('mousedown');
        assert.strictEqual(sug.selected, true);
        assert.ok(sug.elem.hasClass('selected'));
        assert.strictEqual(widget.dd_elem.css('display'), 'none');
        assert.strictEqual(widget.input_elem.val(), 'foo');
    });
});

function create_elem(arr, params) {
    let widget_html = $(`
        <div class="yafowil-widget-autocomplete">
          <input class="autocomplete" type="text" />
          <div class="autocomplete-source">
            ${arr}
          </div>
          <div class="autocomplete-params">
            ${params}
          </div>
        </div>
    `);
    return widget_html;
}