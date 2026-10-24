import $ from 'jquery';
import * as bs5_widget from '../src/bootstrap5/widget.js';
import * as default_widget from '../src/default/widget.js';

/**
 * Import a bundle and capture its DOM ready callback instead of letting
 * jQuery run it once, so every registration branch can be exercised.
 */
async function import_bundle(load) {
    const orig_ready = $.fn.ready;
    let on_ready;
    $.fn.ready = function (fn) {
        on_ready = fn;
        return this;
    };
    try {
        const bundle = await load();
        return { bundle, on_ready };
    } finally {
        $.fn.ready = orig_ready;
    }
}

const variants = [
    ['default', () => import('../src/default/bundle.js'), default_widget],
    ['bootstrap5', () => import('../src/bootstrap5/bundle.js'), bs5_widget],
];

for (const [name, load, widget_module] of variants) {
    QUnit.module(`${name} bundle`, (hooks) => {
        let bundle;
        let on_ready;
        let array_events;

        hooks.before(async () => {
            ({ bundle, on_ready } = await import_bundle(load));
        });
        hooks.beforeEach(() => {
            array_events = [];
            window.yafowil_array = {
                on_array_event: (evt_name) => {
                    array_events.push(evt_name);
                },
                inside_template: () => false,
            };
        });
        hooks.afterEach(() => {
            delete window.ts;
            delete window.bdajax;
            delete window.yafowil_array;
        });

        QUnit.test('exports', (assert) => {
            assert.deepEqual(Object.keys(bundle).sort(), [
                'AutocompleteSuggestion',
                'AutocompleteWidget',
                'register_array_subscribers',
            ]);
            for (const key of Object.keys(widget_module)) {
                assert.strictEqual(bundle[key], widget_module[key]);
            }
        });

        QUnit.test('registers with treibstoff', (assert) => {
            const registered = [];
            window.ts = {
                ajax: {
                    register: (func, instant) => {
                        registered.push([func, instant]);
                    },
                },
            };
            on_ready();
            assert.deepEqual(registered, [[bundle.AutocompleteWidget.initialize, true]]);
            assert.deepEqual(array_events, ['on_add']);
        });

        QUnit.test('registers with bdajax', (assert) => {
            const registered = [];
            window.bdajax = {
                register: (func, instant) => {
                    registered.push([func, instant]);
                },
            };
            on_ready();
            assert.deepEqual(registered, [[bundle.AutocompleteWidget.initialize, true]]);
            assert.deepEqual(array_events, ['on_add']);
        });

        QUnit.test('initializes without ajax framework', (assert) => {
            const elem = $(`
                <div class="yafowil-widget-autocomplete">
                  <input class="autocomplete" type="text" data-delay="0"
                         data-min-length="0" data-source="|one|" data-type="local" />
                  <input class="autocomplete-result" type="hidden" />
                </div>
            `).appendTo('body');
            on_ready();
            const widget = elem.data('yafowil-autocomplete');
            assert.ok(widget instanceof bundle.AutocompleteWidget);
            assert.deepEqual(array_events, ['on_add']);
            widget.destroy();
            elem.remove();
        });
    });
}
