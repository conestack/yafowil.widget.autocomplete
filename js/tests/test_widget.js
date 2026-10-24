import $ from 'jquery';
import {
    AutocompleteSuggestion,
    AutocompleteWidget,
    register_array_subscribers,
} from '../src/default/widget.js';

const container = $('<div id="container" />');
let css_link;

QUnit.module('AutocompleteWidget', (hooks) => {
    let elem;
    let widget;
    const _array_subscribers = {
        on_add: [],
    };

    hooks.before(() => {
        // include link to styles required for test run
        css_link = document.createElement('link');
        css_link.rel = 'stylesheet';
        css_link.href = '../../src/yafowil/widget/autocomplete/resources/default/widget.min.css';
        document.head.appendChild(css_link);
    });
    hooks.beforeEach(() => {
        $('body').append(container);
        elem = create_elem(0, 0, '|one|two|three|four|', 'local');
        container.append(elem);
    });
    hooks.afterEach(() => {
        container.empty();
        if (widget) {
            widget.destroy();
        }
    });
    hooks.after(() => {
        // remove required css styles after test run has finished
        if (css_link) {
            document.head.removeChild(css_link);
        }
    });

    QUnit.test('initialize', (assert) => {
        AutocompleteWidget.initialize();
        widget = elem.data('yafowil-autocomplete');

        assert.deepEqual(widget.elem, elem);
        assert.ok(widget.input_elem.is('input.autocomplete'));
        assert.ok(widget.dd_elem.is('div.autocomplete-dropdown'));
        assert.ok(widget.parse_source);

        assert.ok(widget.on_input);
        assert.ok(widget.hide_dropdown);
        assert.ok(widget.on_keydown);
        assert.ok(widget.autocomplete);
    });

    QUnit.test('compile disables spellcheck and browser autocomplete', (assert) => {
        AutocompleteWidget.initialize();
        widget = elem.data('yafowil-autocomplete');

        // jQuery 4 removes an attribute set to boolean ``false``
        assert.strictEqual(widget.input_elem.attr('spellcheck'), 'false');
        assert.strictEqual(widget.input_elem.attr('autocomplete'), 'off');
    });

    QUnit.test('initialize twice binds once', (assert) => {
        // ``initialize`` takes a context, and a context is commonly a parent:
        // an ajax reload that replaces one element re-binds its parent, so
        // every widget beside the replaced one arrives here again. A second
        // widget on the same element binds its handlers twice and leaves the
        // first one unreachable.
        AutocompleteWidget.initialize();
        widget = elem.data('yafowil-autocomplete');

        AutocompleteWidget.initialize();

        assert.strictEqual(elem.data('yafowil-autocomplete'), widget);
        // The dropdown hangs on ``body``, not inside the widget - a second
        // construction leaves a second one behind, orphaned, because only the
        // last widget is reachable through the data key to destroy it.
        assert.strictEqual($('body > div.autocomplete-dropdown').length, 1);
    });

    QUnit.test('register_array_subscribers', (assert) => {
        container.empty();
        // patch window.yafowil
        window.yafowil = {
            array: undefined,
        };
        // return if window.yafowil === undefined
        register_array_subscribers();
        widget = elem.data('yafowil-autocomplete');

        // patch yafowil_array
        window.yafowil_array = {
            on_array_event: (evt_name, evt_function) => {
                _array_subscribers[evt_name] = evt_function;
            },
            inside_template(elem) {
                return elem.parents('.arraytemplate').length > 0;
            },
        };
        register_array_subscribers();

        // create table DOM
        const table = $('<table />')
            .append($('<tr id="row" />'))
            .append($('<td />'))
            .appendTo('body');
        $('td', table).addClass('arraytemplate');
        const el = create_elem(0, 0, '|one|two|three|four|', 'local');
        el.appendTo($('td', table));

        // invoke array on_add - returns
        const context = $('#row');
        _array_subscribers.on_add.apply(null, context);
        widget = el.data('yafowil-autocomplete');
        assert.notOk(widget);
        $('td', table).removeClass('arraytemplate');

        // invoke array on_add
        _array_subscribers.on_add.apply(null, context);
        widget = el.data('yafowil-autocomplete');
        assert.ok(widget);

        table.remove();
        delete window.yafowil;
        delete window.yafowil_array;
    });

    QUnit.test('register_array_subscribers with yafowil.array hooks', (assert) => {
        window.yafowil = {
            array: { hooks: { add: {} } },
        };
        register_array_subscribers();
        assert.strictEqual(
            window.yafowil.array.hooks.add.autocomplete_binder,
            AutocompleteWidget.initialize,
        );
        delete window.yafowil;
    });

    QUnit.test('register_array_subscribers without yafowil namespace', (assert) => {
        // no global ``yafowil`` if the widget is used as ES module
        register_array_subscribers();
        assert.strictEqual(window.yafowil, undefined);
        assert.strictEqual(window.yafowil_array, undefined);
    });

    QUnit.module('ts integration', (hooks) => {
        let attached;
        let deprecated;

        hooks.beforeEach(() => {
            attached = [];
            deprecated = [];
            window.ts = {
                ajax: {
                    attach: (inst, el) => {
                        attached.push({ inst, el });
                    },
                },
                deprecate: (...args) => {
                    deprecated.push(args);
                },
            };
        });
        hooks.afterEach(() => {
            delete window.ts;
        });

        QUnit.test('widget is attached to ts.ajax', (assert) => {
            AutocompleteWidget.initialize();
            widget = elem.data('yafowil-autocomplete');
            assert.strictEqual(attached.length, 1);
            assert.strictEqual(attached[0].inst, widget);
            assert.strictEqual(attached[0].el[0], elem[0]);
        });

        QUnit.test('unload is deprecated and destroys', (assert) => {
            AutocompleteWidget.initialize();
            widget = elem.data('yafowil-autocomplete');
            widget.unload();
            assert.deepEqual(deprecated, [
                [
                    'yafowil.widget.autocomplete.unload',
                    'yafowil.widget.autocomplete.destroy',
                    'yafowil 2.1',
                ],
            ]);
            assert.strictEqual($('.autocomplete-dropdown').length, 0);
        });
    });

    QUnit.test('unload without ts destroys', (assert) => {
        AutocompleteWidget.initialize();
        widget = elem.data('yafowil-autocomplete');
        widget.unload();
        assert.strictEqual($('.autocomplete-dropdown').length, 0);
    });

    QUnit.module('parse_source()', () => {
        QUnit.test('function 1', (assert) => {
            const arr = ['one', 'two', 'three'];
            $('.autocomplete', elem).data('source', 'javascript:foo.bar');
            window.foo = {
                bar: (_request, response) => {
                    response(arr);
                },
            };
            AutocompleteWidget.initialize();
            widget = elem.data('yafowil-autocomplete');
            widget.autocomplete();

            const done = assert.async();
            setTimeout(() => {
                for (const i in widget.suggestions) {
                    const val = widget.suggestions[i].value;
                    assert.strictEqual(val, arr[i]);
                }
                done();
            }, 10);

            window.foo = null;
        });

        QUnit.test('function 2', (assert) => {
            const arr = ['one', 'two', 'three'];
            $('.autocomplete', elem).data('source', 'javascript:foo.bar.baz');
            window.foo = {
                bar: {
                    baz: (_request, response) => {
                        response(arr);
                    },
                },
            };
            AutocompleteWidget.initialize();
            widget = elem.data('yafowil-autocomplete');
            widget.autocomplete();

            const done = assert.async();
            setTimeout(() => {
                for (const i in widget.suggestions) {
                    const val = widget.suggestions[i].value;
                    assert.strictEqual(val, arr[i]);
                }
                done();
            }, 10);

            window.foo = null;
        });

        QUnit.test('function error', (assert) => {
            $('.autocomplete', elem).data('source', 'javascript:foo.bar');
            window.foo = {};
            assert.throws(() => {
                AutocompleteWidget.initialize();
            }, new Error('Cannot locate source function: javascript:foo.bar'));
        });

        QUnit.test('function returning invalid data', (assert) => {
            $('.autocomplete', elem).data('source', 'javascript:foo.bar');
            window.foo = {
                bar: (_request, response) => {
                    response('one');
                },
            };
            AutocompleteWidget.initialize();
            widget = elem.data('yafowil-autocomplete');
            assert.throws(() => {
                widget.autocomplete();
            }, /invalid datatype, data must be array of strings or objects/);
            delete window.foo;
        });

        QUnit.test('local', (assert) => {
            AutocompleteWidget.initialize();
            widget = elem.data('yafowil-autocomplete');
            assert.strictEqual(widget.sourcetype, 'local');
        });

        QUnit.test('local error', (assert) => {
            $('.autocomplete', elem).data('type', 'local');
            $('.autocomplete', elem).data('source', '');
            assert.throws(() => {
                AutocompleteWidget.initialize();
            }, new Error('Local source is empty'));
        });

        QUnit.test('remote', (assert) => {
            const _real_ajax = $.ajax;
            let ajax_opts;

            $.ajax = (opts) => {
                ajax_opts = {
                    url: opts.url,
                    params: opts.data,
                    type: opts.dataType,
                };
                opts.success(['one', 'two']);
            };

            $('.autocomplete', elem).data('type', 'remote');
            AutocompleteWidget.initialize();
            widget = elem.data('yafowil-autocomplete');
            assert.strictEqual(widget.sourcetype, 'remote');

            widget.autocomplete();
            assert.deepEqual(ajax_opts, {
                url: '|one|two|three|four|',
                params: { term: '' },
                type: 'json',
            });

            const done = assert.async();
            setTimeout(() => {
                assert.strictEqual(widget.suggestions.length, 2);
                assert.strictEqual(widget.suggestions[0].value, 'one');
                assert.strictEqual(widget.suggestions[1].value, 'two');
                done();
            }, 10);

            $.ajax = _real_ajax;
        });

        QUnit.test('remote error', (assert) => {
            const _real_ajax = $.ajax;

            $.ajax = (opts) => {
                opts.error();
            };

            $('.autocomplete', elem).data('type', 'remote');
            $('.autocomplete', elem).data('source', 'test.json');

            AutocompleteWidget.initialize();
            widget = elem.data('yafowil-autocomplete');
            assert.throws(() => {
                widget.autocomplete();
            }, new Error('Cannot locate JSON at: test.json'));

            $.ajax = _real_ajax;
        });
    });

    QUnit.test('placement', (assert) => {
        elem.css({
            top: `${$(window).outerHeight()}px`,
            position: 'absolute',
        });
        // initialize widget
        AutocompleteWidget.initialize();
        widget = elem.data('yafowil-autocomplete');

        // dropdown is hidden
        assert.strictEqual(widget.dd_elem.css('display'), 'none');

        widget.input_elem.val('e');
        widget.autocomplete();

        assert.strictEqual(
            widget.dd_elem.offset().top,
            widget.input_elem.offset().top - widget.dd_elem.outerHeight(),
        );
    });

    QUnit.test('destroy', (assert) => {
        // initialize widget
        AutocompleteWidget.initialize();
        widget = elem.data('yafowil-autocomplete');

        // dropdown is hidden
        assert.strictEqual(widget.dd_elem.css('display'), 'none');

        // set input value
        widget.input_elem.val('fo');

        // trigger autocomplete to add suggestions
        widget.autocomplete();

        // async operation due to timeout in source code
        const done = assert.async();
        setTimeout(() => {
            // one suggestion has been appended ('four')
            assert.ok(widget.suggestions.length, 1);
            assert.strictEqual(widget.dd_elem.css('display'), 'block');

            // trigger hiding of dropdown
            widget.hide_dropdown();

            // destroy (unload) widget
            widget.destroy();

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
            const keydown = new $.Event('keydown', { key: 'ArrowDown' });
            widget.input_elem.trigger(keydown);
            assert.strictEqual(widget.dd_elem.css('display'), 'none');

            assert.strictEqual($('.autocomplete-dropdown').length, 0);
            done();
        }, 10);
    });

    QUnit.module('input_handle()', () => {
        QUnit.test('input', (assert) => {
            // initialize widget
            AutocompleteWidget.initialize();
            widget = elem.data('yafowil-autocomplete');
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

            const done = assert.async();

            setTimeout(() => {
                assert.strictEqual(widget.suggestions.length, 1);
                assert.strictEqual(widget.suggestions[0].value, 'four');
                done();
            }, 500);
        });

        QUnit.test('timeout', (assert) => {
            // initialize widget
            AutocompleteWidget.initialize();
            widget = elem.data('yafowil-autocomplete');
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

            const done1 = assert.async();
            const done2 = assert.async();

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

        QUnit.test('under min length', (assert) => {
            // initialize widget
            AutocompleteWidget.initialize();
            widget = elem.data('yafowil-autocomplete');
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

            const done = assert.async();

            setTimeout(() => {
                assert.strictEqual(widget.suggestions.length, 0);
                done();
            }, 100);
        });
    });

    QUnit.test('autocomplete', (assert) => {
        // initialize widget
        AutocompleteWidget.initialize();
        widget = elem.data('yafowil-autocomplete');

        widget.input_elem.trigger('focus');
        widget.input_elem.val('o');
        widget.input_elem.trigger('input');

        const done = assert.async();
        setTimeout(() => {
            const sugs = [];
            for (const sug of widget.suggestions) {
                sugs.push(sug.value);
            }
            assert.strictEqual(sugs[0], 'one');
            assert.strictEqual(sugs[1], 'two');
            assert.strictEqual(sugs[2], 'four');
            done();
        }, 10);
    });

    QUnit.test('arrow keys without suggestions', (assert) => {
        AutocompleteWidget.initialize();
        widget = elem.data('yafowil-autocomplete');
        widget.input_elem.trigger(new $.Event('keydown', { key: 'ArrowDown' }));
        assert.strictEqual(widget.current_focus, 1);
        assert.strictEqual($('.autocomplete-suggestion.selected').length, 0);
    });

    QUnit.module('keydown_handle()', (hooks) => {
        const array = [
            'one',
            'two',
            'three',
            'four',
            'five',
            'six',
            'seven',
            'eight',
            'nine',
            'ten',
            'eleven',
            'twelve',
            'thirteen',
            'fourteen',
            'fifteen',
            'sixteen',
            'seventeen',
            'eighteen',
            'nineteen',
            'twenty',
        ];

        hooks.beforeEach(() => {
            $('.autocomplete', elem).data('source', array.join('|'));
            // initialize widget
            AutocompleteWidget.initialize();
            widget = elem.data('yafowil-autocomplete');
        });
        hooks.afterEach(() => {
            container.empty();
            if (widget) {
                widget.destroy();
            }
        });

        QUnit.test('ArrowDown', (assert) => {
            widget.input_elem.trigger('focus');
            widget.input_elem.val('t');
            widget.input_elem.trigger('input');

            const down = new $.Event('keydown', { key: 'ArrowDown' });
            // async operation due to timeout - even if it's 0
            const done = assert.async();
            setTimeout(() => {
                // focus on autocomplete is -1
                assert.strictEqual(widget.current_focus, -1);
                assert.strictEqual(widget.suggestions.length, 13);

                // trigger events for ArrowDown
                for (let i = 0; i < 13; i++) {
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

        QUnit.test('ArrowUp', (assert) => {
            widget.input_elem.trigger('focus');
            widget.input_elem.val('t');
            widget.input_elem.trigger('input');

            const up = new $.Event('keydown', { key: 'ArrowUp' });
            // async operation due to timeout - even if it's 0
            const done = assert.async();
            setTimeout(() => {
                // focus on autocomplete is -1
                assert.strictEqual(widget.current_focus, -1);
                assert.strictEqual(widget.suggestions.length, 13);

                // trigger ArrowUp on first suggestion
                widget.input_elem.trigger(up);
                // focus reset to 12
                assert.strictEqual(widget.current_focus, 12);

                // trigger events for ArrowUp
                for (let i = 11; i > 0; i--) {
                    widget.input_elem.trigger(up);
                    assert.strictEqual(widget.current_focus, i);
                }
                done();
            }, 100);
        });

        QUnit.test('Enter', (assert) => {
            const down = new $.Event('keydown', { key: 'ArrowDown' });
            const enter = new $.Event('keydown', { key: 'Enter' });
            widget.input_elem.trigger('focus');
            widget.input_elem.val('t');
            widget.input_elem.trigger('input');

            // async operation due to timeout - even if it's 0
            const done = assert.async();
            setTimeout(() => {
                // focus on autocomplete is -1
                assert.strictEqual(widget.current_focus, -1);
                assert.strictEqual(widget.suggestions.length, 13);

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

        QUnit.test('Escape', (assert) => {
            const escape_key = new $.Event('keydown', { key: 'Escape' });
            widget.input_elem.trigger('focus');
            widget.input_elem.val('t');
            widget.input_elem.trigger('input');

            // async operation due to timeout - even if it's 0
            const done = assert.async();
            setTimeout(() => {
                // trigger Escape key
                widget.input_elem.trigger(escape_key);
                assert.strictEqual(widget.current_focus, -1);
                assert.strictEqual(widget.input_elem.val(), 't');
                assert.strictEqual(widget.dd_elem.css('display'), 'none');
                assert.notOk(widget.input_elem.is(':focus'));
                done();
            }, 10);
        });

        QUnit.test('Tab', (assert) => {
            const down = new $.Event('keydown', { key: 'ArrowDown' });
            const tab = new $.Event('keydown', { key: 'Tab' });

            const dummy_input = $('<input type="text" />');
            dummy_input.appendTo('body');

            widget.input_elem.trigger('focus');
            widget.input_elem.val('t');
            widget.input_elem.trigger('input');

            // async operation due to timeout - even if it's 0
            const done = assert.async();
            setTimeout(() => {
                // trigger ArrowDown key
                widget.input_elem.trigger(down);
                assert.strictEqual(widget.current_focus, 0);
                // trigger Tab key
                widget.input_elem.trigger(tab);
                assert.strictEqual(widget.input_elem.val(), widget.suggestions[0].value);
                assert.strictEqual(widget.dd_elem.css('display'), 'none');
                assert.notOk(widget.input_elem.is(':focus'));

                done();
            }, 10);

            dummy_input.remove();
        });

        QUnit.test('PageDown', (assert) => {
            const down = new $.Event('keydown', { key: 'ArrowDown' });
            const pagedown = new $.Event('keydown', { key: 'PageDown' });

            widget.input_elem.trigger('focus');
            widget.input_elem.val('e');
            widget.input_elem.trigger('input');

            // async operation due to timeout - even if it's 0
            const done = assert.async();
            setTimeout(() => {
                // trigger ArrowDown key
                widget.input_elem.trigger(down);
                assert.strictEqual(widget.current_focus, 0);

                // trigger PageDown key
                widget.input_elem.trigger(pagedown);

                const elem_top = $('.selected').offset().top;
                const dd_top = widget.dd_elem.offset().top;
                assert.ok(elem_top > dd_top);
                done();
            }, 10);
        });

        QUnit.test('PageUp', (assert) => {
            const down = new $.Event('keydown', { key: 'ArrowDown' });
            const pageup = new $.Event('keydown', { key: 'PageUp' });
            const up = new $.Event('keydown', { key: 'ArrowUp' });

            widget.input_elem.trigger('focus');
            widget.input_elem.val('e');
            widget.input_elem.trigger('input');

            // async operation due to timeout - even if it's 0
            const done = assert.async();
            setTimeout(() => {
                // focus on autocomplete is -1
                assert.strictEqual(widget.current_focus, -1);
                assert.strictEqual(widget.suggestions.length, 17);

                // trigger ArrowDown key
                widget.input_elem.trigger(down);
                assert.strictEqual(widget.current_focus, 0);

                widget.input_elem.trigger(up);
                assert.strictEqual(widget.current_focus, 16);

                // trigger PageUp key
                widget.input_elem.trigger(pageup);

                const elem_top = $('.selected').offset().top;
                const dd_top = widget.dd_elem.offset().top;
                assert.ok(elem_top > dd_top);
                assert.strictEqual(widget.current_focus, 0);
                done();
            }, 10);
        });

        QUnit.test('PageUp selects first visible suggestion', (assert) => {
            const items = [];
            for (let i = 0; i < 60; i++) {
                items.push(`item ${i}`);
            }
            widget.source = (_request, response) => {
                response(items);
            };
            widget.dd_elem.css({ maxHeight: '320px', overflowY: 'auto' });
            widget.input_elem.val('item');
            widget.autocomplete();

            // scroll to last suggestion
            widget.current_focus = 0;
            widget.input_elem.trigger(new $.Event('keydown', { key: 'ArrowUp' }));
            assert.strictEqual(widget.current_focus, 59);

            widget.input_elem.trigger(new $.Event('keydown', { key: 'PageUp' }));
            const index = widget.current_focus;
            const dd_top = widget.dd_elem.offset().top;
            assert.ok(index > 0);
            assert.ok(widget.suggestions[index - 1].elem.offset().top < dd_top);
            assert.ok(widget.suggestions[index].elem.offset().top >= dd_top);
            assert.ok(widget.suggestions[index].selected);
        });
    });
});

QUnit.module('AutocompleteSuggestion', (hooks) => {
    let elem;
    let widget;
    let sug;

    hooks.beforeEach(() => {
        $('body').append(container);
        elem = create_elem(0, 0, ' ', 'local');
        container.append(elem);
    });
    hooks.afterEach(() => {
        container.empty();
        if (widget) {
            widget.destroy();
        }
        sug = null;
    });

    QUnit.test('constructor', (assert) => {
        AutocompleteWidget.initialize();
        widget = elem.data('yafowil-autocomplete');

        sug = new AutocompleteSuggestion(widget, 'foo', 'foo');
        widget.suggestions.push(sug);

        assert.ok(sug.elem.is('div.autocomplete-suggestion'));
        assert.ok(sug.elem.parent('div.autocomplete-dropdown'));
        assert.strictEqual(sug.value, 'foo');
    });

    QUnit.test('constructor with object source', (assert) => {
        AutocompleteWidget.initialize();
        widget = elem.data('yafowil-autocomplete');

        sug = new AutocompleteSuggestion(widget, { id: 'k1', title: 'Foo' }, 'fo');
        widget.suggestions.push(sug);

        assert.strictEqual(sug.id, 'k1');
        assert.strictEqual(sug.value, 'Foo');
        assert.strictEqual($('strong', sug.elem).text(), 'Fo');

        sug.elem.trigger('mousedown');
        assert.strictEqual(widget.result_input.val(), 'k1');
        assert.strictEqual(widget.input_elem.val(), 'Foo');
    });

    QUnit.test('constructor with invalid source', (assert) => {
        AutocompleteWidget.initialize();
        widget = elem.data('yafowil-autocomplete');

        assert.throws(
            () => {
                sug = new AutocompleteSuggestion(widget, 42, 'foo');
            },
            (err) =>
                err ===
                'yafowil.widget.autocomplete: Invalid Suggestion type. ' +
                    'Suggestion must be string or {key: value} object.',
        );
    });

    QUnit.test('select()', (assert) => {
        AutocompleteWidget.initialize();
        widget = elem.data('yafowil-autocomplete');

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

QUnit.module('AutocompleteValueMode', (hooks) => {
    // The hidden input is the only named field, so whatever the server is
    // supposed to receive has to end up in it. Which of the two inputs holds
    // the value depends on the mode, and getting that wrong loses the entry
    // silently - the form posts an empty string and the page just comes back.
    let elem, widget;

    hooks.beforeEach(() => {
        $('body').append(container);
    });
    hooks.afterEach(() => {
        container.empty();
        if (widget) {
            widget.destroy();
            widget = null;
        }
    });

    function setup(keys) {
        elem = create_elem(0, 0, '|one|two|three|', 'local', keys);
        container.append(elem);
        widget = new AutocompleteWidget(elem);
        return widget;
    }

    QUnit.test('typed text reaches the hidden field in value mode', (assert) => {
        setup(false);
        widget.input_elem.val('freitext').trigger('input');
        assert.strictEqual(widget.result_input.val(), 'freitext');
    });

    QUnit.test('typing clears the key in keyed mode', (assert) => {
        setup(true);
        widget.result_input.val('abc');
        widget.input_elem.val('Ome').trigger('input');
        widget.on_keydown(new $.Event('keydown', { key: 'e' }));
        assert.strictEqual(widget.result_input.val(), '');
    });

    QUnit.test('typing does not clear the value in value mode', (assert) => {
        setup(false);
        widget.input_elem.val('frei').trigger('input');
        widget.on_keydown(new $.Event('keydown', { key: 'i' }));
        assert.strictEqual(widget.result_input.val(), 'frei');
    });

    QUnit.test('a selection writes key and label apart in keyed mode', (assert) => {
        setup(true);
        widget.select_suggestion('abc', 'Omega GmbH');
        assert.strictEqual(widget.result_input.val(), 'abc');
        assert.strictEqual(widget.input_elem.val(), 'Omega GmbH');
    });

    QUnit.test('a selection writes the label twice in value mode', (assert) => {
        setup(false);
        widget.select_suggestion(null, 'one');
        assert.strictEqual(widget.result_input.val(), 'one');
        assert.strictEqual(widget.input_elem.val(), 'one');
    });

    QUnit.test('arrow navigation clears the key in keyed mode', (assert) => {
        setup(true);
        widget.result_input.val('abc');
        widget.unselect_all();
        assert.strictEqual(widget.result_input.val(), '');
    });

    QUnit.test('arrow navigation keeps the typed value in value mode', (assert) => {
        // ``unselect_all`` used to wipe the hidden field on every arrow key.
        setup(false);
        widget.input_elem.val('on').trigger('input');
        widget.unselect_all();
        assert.strictEqual(widget.result_input.val(), 'on');
    });

    QUnit.test('the mode defaults to value when nothing is declared', (assert) => {
        elem = $(`
            <div class="yafowil-widget-autocomplete">
              <input class="autocomplete" type="text" data-delay="0"
                     data-min-length="0" data-source="|one|" data-type="local" />
              <input class="autocomplete-result" type="hidden" />
            </div>
        `);
        container.append(elem);
        widget = new AutocompleteWidget(elem);
        assert.strictEqual(widget.keys, false);
    });
});

function create_elem(delay, minLength, source, type, keys) {
    const widget_html = $(`
        <div class="yafowil-widget-autocomplete">
          <input class="autocomplete"
                 type="text"
                 data-delay="${delay}"
                 data-min-length="${minLength}"
                 data-source="${source}"
                 data-type="${type}"
                 data-keys="${keys === true}" />
          <input class="autocomplete-result" type="hidden" />
        </div>
    `);
    return widget_html;
}
