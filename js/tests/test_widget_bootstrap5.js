import $ from 'jquery';
import {
    AutocompleteSuggestion,
    AutocompleteWidget,
    register_array_subscribers,
} from '../src/bootstrap5/widget.js';

const container = $('<div id="container" />');

QUnit.module('bootstrap5 AutocompleteWidget', (hooks) => {
    let elem;
    let widget;

    hooks.beforeEach(() => {
        $('body').append(container);
        elem = create_elem(0, 0, '|one|two|three|four|', 'local');
        container.append(elem);
    });
    hooks.afterEach(() => {
        container.empty();
        if (widget) {
            widget.destroy();
            widget = null;
        }
        delete window.ts;
        delete window.yafowil;
        delete window.yafowil_array;
    });

    QUnit.test('initialize', (assert) => {
        AutocompleteWidget.initialize();
        widget = elem.data('yafowil-autocomplete');

        assert.ok(widget instanceof AutocompleteWidget);
        assert.strictEqual(widget.Suggestion, AutocompleteSuggestion);
        assert.ok(widget.dd_elem.is('div.autocomplete-dropdown.card.shadow'));
        assert.ok(widget.ul_elem.is('ul.list-group.list-group-flush'));
        assert.ok(widget.ul_elem.parent().is(widget.dd_elem));
        assert.ok(widget.no_results.is('div.no-results'));
        assert.strictEqual(widget.no_results.text(), 'No results found.');
        assert.strictEqual(widget.no_results.css('display'), 'none');
        assert.strictEqual(widget.input_elem.attr('autocomplete'), 'off');
    });

    QUnit.test('initialize twice binds once', (assert) => {
        AutocompleteWidget.initialize();
        widget = elem.data('yafowil-autocomplete');

        AutocompleteWidget.initialize();

        assert.strictEqual(elem.data('yafowil-autocomplete'), widget);
        assert.strictEqual($('body > div.autocomplete-dropdown').length, 1);
    });

    QUnit.test('initialize skips array template', (assert) => {
        window.yafowil_array = {
            inside_template: (el) => el.is(elem),
        };
        AutocompleteWidget.initialize();
        assert.strictEqual(elem.data('yafowil-autocomplete'), undefined);
    });

    QUnit.test('autocomplete', (assert) => {
        AutocompleteWidget.initialize();
        widget = elem.data('yafowil-autocomplete');

        widget.input_elem.val('o');
        widget.autocomplete();

        assert.deepEqual(
            widget.suggestions.map((sug) => sug.value),
            ['one', 'two', 'four'],
        );
        assert.ok(widget.suggestions[0] instanceof AutocompleteSuggestion);
        assert.strictEqual(widget.ul_elem.children('.autocomplete-suggestion').length, 3);
        assert.strictEqual(widget.no_results.css('display'), 'none');
        assert.strictEqual(widget.dd_elem.css('display'), 'block');
    });

    QUnit.test('autocomplete without results', (assert) => {
        AutocompleteWidget.initialize();
        widget = elem.data('yafowil-autocomplete');

        widget.input_elem.val('xyz');
        widget.autocomplete();

        assert.strictEqual(widget.suggestions.length, 0);
        assert.strictEqual(widget.no_results.css('display'), 'block');
        assert.strictEqual(widget.dd_elem.css('display'), 'block');
    });

    QUnit.test('autocomplete with only ignore_filter items', (assert) => {
        AutocompleteWidget.initialize();
        widget = elem.data('yafowil-autocomplete');
        widget.source = (_request, response) => {
            response([{ id: 'new', title: 'Create new', ignore_filter: true }]);
        };

        widget.input_elem.val('Cre');
        widget.autocomplete();

        assert.strictEqual(widget.suggestions.length, 1);
        assert.strictEqual(widget.suggestions[0].id, 'new');
        assert.strictEqual(widget.no_results.css('display'), 'block');
    });

    QUnit.test('autocomplete with mixed ignore_filter items', (assert) => {
        AutocompleteWidget.initialize();
        widget = elem.data('yafowil-autocomplete');
        widget.source = (_request, response) => {
            response([{ id: 'new', title: 'Create new', ignore_filter: true }, 'Create']);
        };

        widget.input_elem.val('Cre');
        widget.autocomplete();

        assert.strictEqual(widget.suggestions.length, 2);
        assert.strictEqual(widget.no_results.css('display'), 'none');
    });

    QUnit.test('autocomplete with suggestion factory', (assert) => {
        AutocompleteWidget.initialize();
        widget = elem.data('yafowil-autocomplete');

        class CustomSuggestion extends AutocompleteSuggestion {}
        const paths = [];
        window.ts = {
            object_by_path: (path) => {
                paths.push(path);
                return CustomSuggestion;
            },
        };
        widget.source = (_request, response) => {
            response([{ id: 'c', title: 'Custom', factory: 'custom.Suggestion' }]);
        };

        widget.input_elem.val('Cu');
        widget.autocomplete();

        assert.deepEqual(paths, ['custom.Suggestion']);
        assert.strictEqual(widget.suggestions.length, 1);
        assert.ok(widget.suggestions[0] instanceof CustomSuggestion);
    });

    QUnit.test('autocomplete with invalid data', (assert) => {
        AutocompleteWidget.initialize();
        widget = elem.data('yafowil-autocomplete');
        widget.source = (_request, response) => {
            response('one');
        };

        assert.throws(() => {
            widget.autocomplete();
        }, /invalid datatype, data must be array of strings or objects/);
    });

    QUnit.test('placement below input', (assert) => {
        elem.css({ position: 'absolute', top: '0px' });
        AutocompleteWidget.initialize();
        widget = elem.data('yafowil-autocomplete');

        widget.input_elem.val('o');
        widget.autocomplete();

        // the bootstrap5 stylesheet positions the dropdown absolute
        assert.strictEqual(
            widget.dd_elem[0].style.top,
            `${widget.elem.offset().top + widget.elem.outerHeight()}px`,
        );
    });

    QUnit.test('placement above input', (assert) => {
        elem.css({ position: 'absolute', top: `${$(window).outerHeight()}px` });
        AutocompleteWidget.initialize();
        widget = elem.data('yafowil-autocomplete');

        widget.input_elem.val('o');
        widget.autocomplete();

        assert.ok(parseFloat(widget.dd_elem[0].style.top) < widget.elem.offset().top);
    });

    QUnit.test('on_input', (assert) => {
        AutocompleteWidget.initialize();
        widget = elem.data('yafowil-autocomplete');
        widget.input_elem.val('o');
        widget.autocomplete();
        assert.strictEqual(widget.suggestions.length, 3);

        widget.input_elem.val('f').trigger('input');

        assert.strictEqual(widget.suggestions.length, 0);
        assert.strictEqual(widget.current_focus, -1);
        assert.strictEqual(widget.ul_elem.children().length, 0);
        assert.strictEqual(widget.dd_elem.css('display'), 'none');

        const done = assert.async();
        // delay is 0, a timer scheduled afterwards runs after autocomplete
        setTimeout(() => {
            assert.deepEqual(
                widget.suggestions.map((sug) => sug.value),
                ['four'],
            );
            done();
        }, 0);
    });

    QUnit.test('on_input under min length', (assert) => {
        AutocompleteWidget.initialize();
        widget = elem.data('yafowil-autocomplete');
        widget.min_length = 5;

        widget.input_elem.val('f').trigger('input');

        assert.strictEqual(widget.timeout, undefined);
        assert.strictEqual(widget.suggestions.length, 0);
    });

    QUnit.test('hide_dropdown', (assert) => {
        AutocompleteWidget.initialize();
        widget = elem.data('yafowil-autocomplete');
        let hidden = 0;
        elem.on('dropdown.hidden', () => {
            hidden++;
        });

        widget.input_elem.val('o');
        widget.autocomplete();
        widget.hide_dropdown();

        assert.strictEqual(widget.dd_elem.css('display'), 'none');
        assert.strictEqual(hidden, 1);
    });

    QUnit.module('register_array_subscribers', () => {
        QUnit.test('yafowil_array', (assert) => {
            let on_add;
            window.yafowil_array = {
                on_array_event: (evt_name, evt_function) => {
                    assert.strictEqual(evt_name, 'on_add');
                    on_add = evt_function;
                },
                inside_template: () => false,
            };
            register_array_subscribers();

            on_add(null, container);
            widget = elem.data('yafowil-autocomplete');
            assert.ok(widget instanceof AutocompleteWidget);
        });

        QUnit.test('yafowil.array hooks', (assert) => {
            window.yafowil = {
                array: { hooks: { add: {} } },
            };
            register_array_subscribers();
            assert.strictEqual(
                window.yafowil.array.hooks.add.autocomplete_binder,
                AutocompleteWidget.initialize,
            );
        });

        QUnit.test('no array integration', (assert) => {
            window.yafowil = {
                array: undefined,
            };
            register_array_subscribers();
            assert.deepEqual(window.yafowil, { array: undefined });
        });
    });
});

QUnit.module('bootstrap5 AutocompleteSuggestion', (hooks) => {
    let elem;
    let widget;

    hooks.beforeEach(() => {
        $('body').append(container);
        elem = create_elem(0, 0, ' ', 'local');
        container.append(elem);
        widget = new AutocompleteWidget(elem);
    });
    hooks.afterEach(() => {
        container.empty();
        widget.destroy();
    });

    QUnit.test('compile', (assert) => {
        const sug = new AutocompleteSuggestion(widget, 'Foobar', 'oba');
        widget.suggestions.push(sug);

        assert.ok(sug.elem.is('div.autocomplete-suggestion.list-group-item'));
        assert.ok(sug.elem.parent().is(widget.ul_elem));
        assert.deepEqual(
            sug.elem
                .children()
                .map((_i, el) => `${el.tagName}:${$(el).text()}`)
                .get(),
            ['SPAN:Fo', 'STRONG:oba', 'SPAN:r'],
        );
    });
});

function create_elem(delay, minLength, source, type) {
    return $(`
        <div class="yafowil-widget-autocomplete">
          <input class="autocomplete"
                 type="text"
                 data-delay="${delay}"
                 data-min-length="${minLength}"
                 data-source="${source}"
                 data-type="${type}" />
          <input class="autocomplete-result" type="hidden" />
        </div>
    `);
}
