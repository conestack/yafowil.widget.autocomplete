from yafowil.base import (
    ExtractionError,
    factory,
)
from yafowil.common import (
    generic_extractor,
    generic_required_extractor,
    input_generic_renderer,
)
from yafowil.utils import (
    managedprops
)


@managedprops('source', 'delay', 'minLength')
def autocomplete_renderer(widget, data):
    result = data.rendered
    tag = data.tag
    source = widget.attrs['source']
    if callable(source):
        source = source(widget, data)
    if isinstance(source, (list, tuple)):
        source = '|'.join(source)
        source_type = 'local'
    elif isinstance(source, basestring):
        source_type = 'remote'  
    else:
        raise ValueError, 'resulting source must be tuple/list or string'  
    result += tag('div', source, 
                  **{'class': 'autocomplete-source hiddenStructure'})
    params = [('%s,%s' % (_, widget.attrs[_])) for _ in ['delay', 'minLength']]
    params.append('type,%s' % source_type)
    result += tag('div', '|'.join(params), 
                  **{'class': 'autocomplete-params hiddenStructure'})
    return tag('div', result, **{'class': 'yafowil-widget-autocomplete'})


def autocomplete_extractor(widget, data):    
    return data.extracted


factory.register(
    'autocomplete', 
    extractors=[generic_extractor,
                generic_required_extractor,
                autocomplete_extractor], 
    edit_renderers=[input_generic_renderer, autocomplete_renderer])

factory.doc['blueprint']['autocomplete'] = \
"""Add-on blueprint `yafowil.widget.autocomplete 
<http://github.com/bluedynamics/yafowil.widget.autocomplete/>`_ utilizing 
``jquery.ui.autocomplete`` to offer the user a selection based on the input 
given so far.
"""

factory.defaults['autocomplete.type'] = 'text'

factory.defaults['autocomplete.class'] = 'autocomplete'

factory.defaults['autocomplete.required_class'] = 'required'

factory.defaults['autocomplete.disabled'] = False 

factory.defaults['autocomplete.size'] = None 

factory.defaults['autocomplete.delay'] = '300'
factory.doc['props']['autocomplete.delay'] = \
"""Delay in milliseconds.
"""

factory.defaults['autocomplete.minLength'] = '1'
factory.doc['props']['autocomplete.minLength'] = \
"""Minimum input length to trigger autocomplete.
"""

factory.doc['props']['autocomplete.source'] = \
"""Autocomplete source as python iterable or string defining JSON view callback.
"""
