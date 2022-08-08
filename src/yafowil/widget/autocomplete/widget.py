import json
from yafowil.base import factory
from yafowil.common import generic_extractor
from yafowil.common import generic_required_extractor
from yafowil.common import input_generic_renderer
from yafowil.compat import STR_TYPE
from yafowil.utils import attr_value
from yafowil.utils import managedprops
from yafowil.utils import cssid


@managedprops('source', 'delay', 'minLength', 'dictionary')
def autocomplete_renderer(widget, data):
    result = data.rendered
    tag = data.tag
    source = attr_value('source', widget, data)
    # XXX: cleanup
    if isinstance(source, (list, tuple)):
        try:
            source = '|'.join(source)
        except:
            source = '|'.join(map(lambda x: str(x[0]) + ':' + str(x[1]), source))
        source_type = 'local'
    elif isinstance(source, dict):
        source = '|'.join('{}:{}'.format(k, v) for k,v in source.items())
        source_type = 'local'
    elif isinstance(source, STR_TYPE):
        source_type = 'remote'
    else:
        raise ValueError('resulting source must be tuple/list/dict or string')

    result += tag('input', **{
        'class': 'autocomplete-display form-control',
        'type': 'text',
        'value': ''
    })
    result += tag('div', source, **{
        'class': 'autocomplete-source hiddenStructure'
    })
    params = [
        ('%s,%s' % (_, attr_value(_, widget, data)))
        for _ in ['delay', 'minLength', 'dictionary']
    ]
    params.append('type,%s' % source_type)
    result += tag('div', '|'.join(params), **{
        'class': 'autocomplete-params hiddenStructure'
    })
    return tag('div', result, **{'class': 'yafowil-widget-autocomplete'})


def autocomplete_extractor(widget, data):
    return data.extracted


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
    ]
)

factory.doc['blueprint']['autocomplete'] = """\
Add-on blueprint `yafowil.widget.autocomplete
<http://github.com/conestack/yafowil.widget.autocomplete/>`
"""

factory.defaults['autocomplete.type'] = 'hidden'

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

# XXX: remove
factory.defaults['autocomplete.dictionary'] = False
factory.doc['props']['autocomplete.dictionary'] = """\
Pass key:value pairs as dict.
"""