import {AutocompleteWidget} from '../src/widget.js';

let container = $('<div id="container" />');

////////////////////////////////////////////////////////////////////////////////
// AutocompleteWidget
////////////////////////////////////////////////////////////////////////////////

QUnit.module('AutocompleteWidget', () => {
    let elem;
    let widget;

    QUnit.module('constructor', hooks => {
        let arr = "ad|adipisicing|aliqua|aliquip|amet|anim|aute|cillum|commodo|consectetur|consequat|culpa|cupidatat|deserunt|do|dolor|dolore|duis|ea|eiusmod|elit|enim|esse|est|et|eu|ex|excepteur|exercitation|fugiat|id|in|incididunt|ipsum|irure|labore|laboris|laborum|lorem|magna|minim|mollit|nisi|non|nostrud|nulla|occaecat|officia|pariatur|proident|qui|quis|reprehenderit|sed|sint|sit|sunt|tempor|ullamco|ut|velit|veniam|voluptate";
        let params = "delay,300|minLength,1|type,local";

        hooks.before(() => {
            $('body').append(container);
        });
        hooks.beforeEach(() => {
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
            assert.ok(widget.input.is('input.autocomplete'));
            assert.ok(widget.dd.is('div.autocomplete-dropdown'));

            assert.ok(widget.parse_options);
            assert.ok(widget.parse_source);

            assert.ok(widget.input_handle);
            assert.ok(widget.hide_dropdown);
            assert.ok(widget.show_dropdown);
            assert.ok(widget.keydown);
            assert.ok(widget.autocomplete);
        });
    });

    QUnit.module('parse_options()', hooks => {
        let arr = "ad|adipisicing";
        let params = "delay,300|minLength,1|type,local";

        hooks.before(() => {
            $('body').append(container);
        });
        hooks.beforeEach(() => {
            elem = create_elem(arr, params);
            container.append(elem);
        });
        hooks.afterEach(() => {
            container.empty();
            widget = null;
        });

        QUnit.test('parse_options', assert => {
            AutocompleteWidget.initialize();
            widget = elem.data('autocomplete');

            assert.strictEqual(widget.sourcetype, 'local');
            assert.strictEqual(widget.delay, 300);
            assert.strictEqual(widget.min_length, 1);
        });
    });

    QUnit.module.todo('parse_source()', hooks => {
        let arr = "one|two|three|four";
        let params = "delay,300|minLength,1|type,local";

        hooks.before(() => {
            $('body').append(container);
        });
        hooks.beforeEach(() => {
            elem = create_elem(arr, params);
            container.append(elem);
        });
        hooks.afterEach(() => {
            container.empty();
            widget = null;
        });

        QUnit.test.todo('function', assert => {
            window.foo = {
                bar: function(request, response) {
                    response(['i', 'love', 'donuts']);
                }
            }

            $('div.autocomplete-params').text('delay,300|minLength,1|type,javascript:foo.bar');
            AutocompleteWidget.initialize();
            widget = elem.data('autocomplete');

            assert.strictEqual(widget.sourcetype, 'javascript:foo.bar');
            // widget.autocomplete();
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

    QUnit.module('unload()', hooks => {
        let arr = "one|two|three|four";
        let params = "delay,300|minLength,1|type,local";

        hooks.before(() => {
            $('body').append(container);
        });
        hooks.beforeEach(() => {
            elem = create_elem(arr, params);
            container.append(elem);
        });
        hooks.afterEach(() => {
            container.empty();
            widget = null;
        });

        QUnit.test('unload', assert => {
            // initialize widget
            AutocompleteWidget.initialize();
            widget = elem.data('autocomplete');

            // dropdown is hidden
            assert.strictEqual(widget.dd.css('display'), 'none');

            // set input value
            widget.input.val('fo');

            // trigger autocomplete to add suggestions
            widget.autocomplete();

            // async operation due to timeout in source code
            let done = assert.async();
            setTimeout(() => {
                // one suggestion has been appended ('four')
                assert.ok(widget.suggestions.length, 1);
                assert.strictEqual(widget.dd.css('display'), 'block');

                // trigger hiding of dropdown
                widget.hide_dropdown();

                // unload widget
                widget.unload();

                // trigger focus event
                widget.input.trigger('focus');
                assert.strictEqual(widget.dd.css('display'), 'none');

                // trigger focusout event
                widget.input.trigger('focusout');
                assert.strictEqual(widget.dd.css('display'), 'none');

                // trigger input event
                widget.input.trigger('input');
                assert.strictEqual(widget.dd.css('display'), 'none');

                // trigger keydown event
                let keydown = new $.Event('keydown', {key:'ArrowDown'});
                widget.input.trigger(keydown);
                assert.strictEqual(widget.dd.css('display'), 'none');

                // trigger mousedown on suggestion
                widget.suggestions[0].elem.trigger('mousedown');
                assert.strictEqual(widget.input.val(), 'fo');
                done();
            }, 500);
        });
    });

    QUnit.module('input_handle()', hooks => {
        let arr = "one|two|three|four|five|six";

        hooks.before(() => {
            $('body').append(container);
        });
        hooks.afterEach(() => {
            container.empty();
            widget = null;
        });

        QUnit.test('input', assert => {
            let params = "delay,300|minLength,0|type,local";
            elem = create_elem(arr, params);
            container.append(elem);

            // initialize widget
            AutocompleteWidget.initialize();
            widget = elem.data('autocomplete');

            /**
             * trigger('input') does not perfectly trigger a naturally occuring
             * input event, so we append the value manually
             * See: https://api.jquery.com/trigger/
            */
            widget.input.trigger('focus');
            widget.input.val('f');
            widget.input.trigger('input');

            assert.strictEqual(widget.dd.css('display'), 'none');
            assert.strictEqual(widget.suggestions.length, 0);
            assert.strictEqual(widget.current_focus, -1);

            let done = assert.async();

            setTimeout(() => {
                assert.strictEqual(widget.suggestions.length, 2);
                assert.strictEqual(widget.suggestions[0].value, 'four');
                assert.strictEqual(widget.suggestions[1].value, 'five');
                done();
            }, 500);
        });

        QUnit.test('timeout', assert => {
            let params = "delay,600|minLength,0|type,local";
            elem = create_elem(arr, params);
            container.append(elem);

            // initialize widget
            AutocompleteWidget.initialize();
            widget = elem.data('autocomplete');

            /**
             * trigger('input') does not perfectly trigger a naturally occuring
             * input event, so we append the value manually
             * See: https://api.jquery.com/trigger/
            */
            widget.input.trigger('focus');
            widget.input.val('f');
            widget.input.trigger('input');

            assert.strictEqual(widget.dd.css('display'), 'none');
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
                assert.strictEqual(widget.suggestions.length, 2);
                assert.strictEqual(widget.suggestions[0].value, 'four');
                assert.strictEqual(widget.suggestions[1].value, 'five');
                done2();
            }, 700);
        });

        QUnit.test('under min length', assert => {
            let params = "delay,10|minLength,5|type,local";
            elem = create_elem(arr, params);
            container.append(elem);

            // initialize widget
            AutocompleteWidget.initialize();
            widget = elem.data('autocomplete');

            /**
             * trigger('input') does not perfectly trigger a naturally occuring
             * input event, so we append the value manually
             * See: https://api.jquery.com/trigger/
            */
            widget.input.trigger('focus');
            widget.input.val('f');
            widget.input.trigger('input');

            assert.strictEqual(widget.dd.css('display'), 'none');
            assert.strictEqual(widget.suggestions.length, 0);
            assert.strictEqual(widget.current_focus, -1);

            let done = assert.async();

            setTimeout(() => {
                assert.strictEqual(widget.suggestions.length, 0);
                done();
            }, 100);
        });
    });

    QUnit.module('autocomplete()', hooks => {
        let arr = "en|tu|tre|fire|fem|seks|sju|atte|ni|ti|elleve|tolv|tretten|";

        hooks.before(() => {
            $('body').append(container);
            let params = "delay,0|minLength,0|type,local";
            elem = create_elem(arr, params);
            container.append(elem);

            // initialize widget
            AutocompleteWidget.initialize();
            widget = elem.data('autocomplete');
        });
        hooks.after(() => {
            container.empty();
            widget = null;
        });

        QUnit.test('autocomplete', assert => {
            widget.input.trigger('focus');
            widget.input.val('t');
            widget.input.trigger('input');

            let done = assert.async();
            setTimeout(() => {
                let sugs = [];
                for (let sug of widget.suggestions) {
                    sugs.push(sug.value);
                }
                assert.strictEqual(sugs[0], 'tu');
                assert.strictEqual(sugs[1], 'tre');
                assert.strictEqual(sugs[2], 'ti');
                assert.strictEqual(sugs[3], 'tolv');
                assert.strictEqual(sugs[4], 'tretten');
                done();
            }, 10);
        });
    });

    QUnit.module('keydown()', hooks => {
        let arr = "en|tu|tre|fire|fem|seks|sju|atte|ni|ti|elleve|tolv|tretten|";

        hooks.before(() => {
            $('body').append(container);
            let params = "delay,0|minLength,0|type,local";
            elem = create_elem(arr, params);
            container.append(elem);

            // initialize widget
            AutocompleteWidget.initialize();
            widget = elem.data('autocomplete');
        });
        hooks.after(() => {
            container.empty();
            widget = null;
        });

        QUnit.test('ArrowDown', assert => {
            widget.input.trigger('focus');
            widget.input.val('t');
            widget.input.trigger('input');

            // async operation due to timeout - even if it's 0
            let done = assert.async();
            setTimeout(() => {
                // five suggestions appended
                assert.ok(widget.suggestions.length, 5);
                // create events
                let kd = new $.Event('keydown', {key: 'ArrowDown'});
                let ku = new $.Event('keydown', {key: 'ArrowUp'});
                let kent = new $.Event('keydown', {key: 'Enter'});

                // focus on autocomplete is -1
                assert.strictEqual(widget.current_focus, -1);
                // trigger Enter key
                widget.input.trigger(kent);
                assert.strictEqual(widget.input.val(), 't');

                // trigger events for ArrowDown
                for (let i = 0; i < 5; i++) {
                    widget.input.trigger(kd);
                    assert.strictEqual(widget.current_focus, i);
                }
                // trigger ArrowDown on last suggestion
                widget.input.trigger(kd);
                // focus reset to 0
                assert.strictEqual(widget.current_focus, 0);

                // trigger arrowUp on first suggestion
                widget.input.trigger(ku);
                // focus reset to 4
                assert.strictEqual(widget.current_focus, 4);

                widget.input.trigger(ku);
                // focus on 3
                assert.strictEqual(widget.current_focus, 3);

                // trigger Enter key
                widget.input.trigger(kent);
                assert.strictEqual(widget.input.val(), widget.suggestions[3].value);

                done();
            }, 10);
        });
    });

    QUnit.module('add_active()', hooks => {
        let arr = "en|tu|tre|fire|fem|seks|sju|atte|ni|ti|elleve|tolv|tretten|";

        hooks.before(() => {
            $('body').append(container);
            let params = "delay,0|minLength,0|type,local";
            elem = create_elem(arr, params);
            container.append(elem);

            // initialize widget
            AutocompleteWidget.initialize();
            widget = elem.data('autocomplete');
        });
        hooks.after(() => {
            container.empty();
            widget = null;
        });

        QUnit.test('add active with no suggestions', assert => {
            widget.input.trigger('focus');
            widget.input.val('x');
            widget.input.trigger('input');

            // create events
            let kd = new $.Event('keydown', {key: 'ArrowDown'});

            // async operation due to timeout - even if it's 0
            let done = assert.async();
            setTimeout(() => {
                // no suggestions appended
                assert.strictEqual(widget.suggestions.length, 0);
                widget.input.trigger(kd);
                assert.strictEqual($('div.suggestion.active').length, 0);
                done();
            }, 10);
        });

        QUnit.test('add active on keydown', assert => {
            widget.input.trigger('focus');
            widget.input.val('t');
            widget.input.trigger('input');

            // create events
            let kd = new $.Event('keydown', {key: 'ArrowDown'});

            // async operation due to timeout - even if it's 0
            let done = assert.async();
            setTimeout(() => {
                // five suggestions appended
                assert.strictEqual(widget.suggestions.length, 5);
                widget.input.trigger(kd);
                assert.strictEqual($('div.suggestion.active').length, 1);
                assert.ok(widget.suggestions[0].elem.hasClass('active'));
                done();
            }, 10);
        });
    });

    QUnit.module('show_dropdown()', hooks => {
        let arr = "en|tu|tre|fire|fem|seks|sju|atte|ni|ti|elleve|tolv|tretten|";

        hooks.before(() => {
            $('body').append(container);
            let params = "delay,0|minLength,0|type,local";
            elem = create_elem(arr, params);
            container.append(elem);

            // initialize widget
            AutocompleteWidget.initialize();
            widget = elem.data('autocomplete');
        });
        hooks.after(() => {
            container.empty();
            widget = null;
        });

        QUnit.test('show dropdown', assert => {
            assert.strictEqual(widget.dd.css('display'), 'none');
            widget.input.val('e');
            widget.input.trigger('input').trigger('focus');

            // async operation due to timeout - even if it's 0
            let done = assert.async();
            setTimeout(() => {
                assert.strictEqual(widget.dd.css('display'), 'block');
                done();
            }, 10);
        });
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