import os
from yafowil.base import factory


resourcedir = os.path.join(os.path.dirname(__file__), 'resources')

js = [{
    'resource': 'jquery-ui-1.8.18.autocomplete.min.js',
    'thirdparty': True,
    'order': 20,
}, {
    'resource': 'widget.js',
    'thirdparty': False,
    'order': 21,
}]

default_css = [{
    'resource': 'jquery-ui-1.8.18.autocomplete.css',
    'thirdparty': True,
    'order': 20,
}, {
    'resource': 'widget.css',
    'thirdparty': False,
    'order': 21,
}]

bootstrap_css = [{
    'resource': 'jquery-ui-1.8.16.autocomplete.bootstrap.css',
    'thirdparty': True,
    'order': 20,
}, {
    'resource': 'widget.css',
    'thirdparty': False,
    'order': 21,
}]


def register():
    import widget
    factory.register_theme('default', 'yafowil.widget.autocomplete',
                           resourcedir, js=js, css=default_css)
    factory.register_theme('bootstrap', 'yafowil.widget.autocomplete',
                           resourcedir, js=js, css=bootstrap_css)