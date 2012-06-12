import os

def register():
    import widget


def get_resource_dir():
    return os.path.join(os.path.dirname(__file__), 'resources')


def get_js():
    return [{
        'resource': 'jquery-ui-1.8.18.autocomplete.min.js',
        'thirdparty': True,
        'order': 20,
    }, {
        'resource': 'widget.js',
        'thirdparty': False,
        'order': 21,
    }]


def get_css():
    return [{
        'resource': 'jquery-ui-1.8.18.autocomplete.css',
        'thirdparty': True,
        'order': 20,
    }, {
        'resource': 'widget.css',
        'thirdparty': False,
        'order': 21,
    }]
