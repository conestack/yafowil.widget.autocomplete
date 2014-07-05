import os
from yafowil.base import factory


resourcedir = os.path.join(os.path.dirname(__file__), 'resources')
js = [{
    'group': 'yafowil.widget.autocomplete.dependencies',
    'resource': 'jquery.ui.menu.min.js',
    'order': 20,
}, {
    'group': 'yafowil.widget.autocomplete.dependencies',
    'resource': 'jquery.ui.autocomplete.min.js',
    'order': 20,
}, {
    'group': 'yafowil.widget.autocomplete.common',
    'resource': 'widget.js',
    'order': 21,
}]
default_css = [{
    'group': 'yafowil.widget.autocomplete.dependencies',
    'resource': 'jquery.ui.menu.css',
    'order': 20,
}, {
    'group': 'yafowil.widget.autocomplete.dependencies',
    'resource': 'jquery.ui.autocomplete.css',
    'order': 20,
}, {
    'group': 'yafowil.widget.autocomplete.common',
    'resource': 'widget.css',
    'order': 21,
}]
bootstrap_css = [{
    'group': 'yafowil.widget.autocomplete.dependencies',
    'resource': 'jquery.ui.menu.bootstrap.css',
    'order': 20,
}, {
    'group': 'yafowil.widget.autocomplete.dependencies',
    'resource': 'jquery.ui.autocomplete.bootstrap.css',
    'order': 20,
}, {
    'group': 'yafowil.widget.autocomplete.common',
    'resource': 'widget.css',
    'order': 21,
}]


def register():
    import widget
    factory.register_theme('default', 'yafowil.widget.autocomplete',
                           resourcedir, js=js, css=default_css)
    factory.register_theme('bootstrap', 'yafowil.widget.autocomplete',
                           resourcedir, js=js, css=bootstrap_css)