from yafowil.base import factory
from yafowil.common import generic_extractor
from yafowil.common import generic_required_extractor
from yafowil.common import generic_display_renderer
from yafowil.common import input_generic_renderer
from yafowil.compat import STR_TYPE
from yafowil.utils import attr_value
from yafowil.utils import managedprops
from yafowil.common import input_attributes_common
from yafowil.utils import data_attrs_helper
from yafowil.utils import managedprops
from yafowil.utils import cssid
from yafowil.utils import as_data_attrs
from yafowil.utils import cssclasses


autocomplete_options = ['source', 'delay', 'minLength']

@managedprops(*autocomplete_options)
def autocomplete_renderer(widget, data):
    tag = data.tag
    input_attrs = input_attributes_common(widget, data, excludes=['name_', 'id'])

    source = attr_value('source', widget, data)
    if isinstance(source, (list, tuple)):
        source = '|'.join(source)
        source_type = 'local'
    elif isinstance(source, STR_TYPE):
        source_type = 'remote'
    else:
        raise ValueError('resulting source must be tuple/list or string')

    custom_attrs = data_attrs_helper(widget, data, autocomplete_options)
    custom_attrs.update(as_data_attrs({
        'source': source,
        'type': source_type
    }))

    input_attrs.update(custom_attrs)
    input_attrs['type'] = 'text'
    input_tag = tag('input', **input_attrs)
    value_attrs = {
        'type': 'hidden',
        'value': '',
        'name_': widget.dottedpath,
        'id': cssid(widget, 'input'),
        'class_': 'autocomplete-result'
    }
    value_tag = tag('input', **value_attrs)
    return tag('div', input_tag, value_tag, **{'class': cssclasses(widget, data, classattr='wrapper_class')})


def autocomplete_extractor(widget, data):
    return {
        'value': data.extracted
    }


factory.register(
    'autocomplete',
    extractors=[
        generic_extractor,
        generic_required_extractor,
        autocomplete_extractor
    ],
    edit_renderers=[
        input_generic_renderer,
        autocomplete_renderer
    ],
    display_renderers=[
        generic_display_renderer
    ]
)

factory.doc['blueprint']['autocomplete'] = """\
Add-on blueprint `yafowil.widget.autocomplete
<http://github.com/conestack/yafowil.widget.autocomplete/>`_ utilizing
``jquery.ui.autocomplete`` to offer the user a selection based on the input
given so far.
"""

factory.defaults['autocomplete.type'] = 'text'

factory.defaults['wrapper_class'] = 'yafowil-widget-autocomplete'

factory.defaults['autocomplete.class'] = 'autocomplete'

factory.defaults['autocomplete.required_class'] = 'required'

factory.defaults['autocomplete.disabled'] = False

factory.defaults['autocomplete.size'] = None

factory.defaults['autocomplete.delay'] = '300'
factory.doc['props']['autocomplete.delay'] = """\
Delay in milliseconds.
"""

factory.defaults['autocomplete.minLength'] = '1'
factory.doc['props']['autocomplete.minLength'] = """\
Minimum input length to trigger autocomplete.
"""

factory.doc['props']['autocomplete.source'] = """\
Autocomplete source as python iterable or string defining JSON view callback.
"""
