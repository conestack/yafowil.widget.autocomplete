from yafowil.base import (
    ExtractionError,
    factory,
)
from yafowil.common import input_generic_renderer
from yafowil.utils import tag

def autocomplete_renderer(widget, data):
    data.attrs['input_field_type'] = 'text'
    result = input_generic_renderer(widget, data)
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
    #TODO
    return data.extracted

factory.register('autocomplete', 
                 [autocomplete_extractor], 
                 [autocomplete_renderer])
factory.defaults['autocomplete.class'] = 'autocomplete'
factory.defaults['autocomplete.required_class'] = 'required'
factory.defaults['autocomplete.delay'] = '300' #ms
factory.defaults['autocomplete.minLength'] = '1' #characters