from node.utils import UNSET
from yafowil.base import factory
from yafowil.common import generic_display_renderer
from yafowil.common import generic_extractor
from yafowil.common import generic_required_extractor
from yafowil.common import input_attributes_common
from yafowil.common import input_generic_renderer
from yafowil.utils import as_data_attrs
from yafowil.utils import attr_value
from yafowil.utils import cssclasses
from yafowil.utils import cssid
from yafowil.utils import data_attrs_helper
from yafowil.utils import managedprops


autocomplete_options = ['source', 'delay', 'minLength']

LABEL_SUFFIX = '.label'
"""Name suffix of the visible input in keyed mode.

Mirrors ``.uid`` of the reference browser, the sibling widget: there the visible
field carries the label and the hidden one the identity. Kept out of value mode,
where the hidden field **is** the text and a second one would carry the same
string twice.
"""


def unwrap_extracted(value):
    """Value out of what :func:`autocomplete_extractor` returned.

    The extractor hands back a dict, and on a re-render after a failed
    validation that dict *is* the value to render. Written out as it comes it
    lands in the input as its repr - which is what the user sees instead of what
    they typed.
    """
    if isinstance(value, dict):
        return value.get('value')
    return value


def is_keyed(widget, data):
    """Whether value, source and extracted carry key/label pairs.

    Declared through ``keys`` rather than guessed, with one inference: a local
    source of pairs can only be keyed. A remote source cannot be judged here at
    all - the server does not know what the endpoint answers - so it has to be
    told.
    """
    keys = attr_value('keys', widget, data)
    if keys is not None:
        return bool(keys)
    source = attr_value('source', widget, data)
    if isinstance(source, (list, tuple)):
        return bool(source) and isinstance(source[0], (list, tuple))
    return False


def fetch_autocomplete_key(widget, data):
    """The value the form carries - the key in keyed mode."""
    if data.extracted is not UNSET:
        return unwrap_extracted(data.extracted) or ''
    value = data.value
    if value is UNSET or not value:
        return ''
    if isinstance(value, (list, tuple)):
        return value[0]
    return value


def fetch_autocomplete_label(widget, data, key):
    """The text the visible input shows, in this order:

    1. what came back in ``<dotted>.label`` - it survives a failed validation
       and keeps half typed input, which a resolved label would throw away
    2. ``lookup(key)`` - for the first render of an edit form, where the
       application stored only the identity
    3. the label half of a ``(key, label)`` value
    4. the key itself - degraded rather than broken, and visibly so
    """
    label_path = widget.dottedpath + LABEL_SUFFIX
    request = data.request
    if request is not UNSET and label_path in request:
        return request[label_path]
    # Read off the attributes rather than through attr_value: that one
    # calls a callable value with (widget, data), which is exactly what a
    # lookup is not. reference.lookup does it the same way.
    lookup = widget.attrs.get('lookup')
    if lookup and key:
        resolved = lookup(key)
        if resolved:
            return resolved
    value = data.value
    if isinstance(value, (list, tuple)) and len(value) > 1:
        return value[1]
    return key


@managedprops(*(autocomplete_options + ['keys', 'lookup']))
def autocomplete_renderer(widget, data):
    tag = data.tag
    input_attrs = input_attributes_common(widget, data, excludes=['name_', 'id'])

    source = attr_value('source', widget, data)
    if isinstance(source, (list, tuple)):
        source = '|'.join(
            item[0] if isinstance(item, (list, tuple)) else item for item in source
        )
        source_type = 'local'
    elif isinstance(source, str):
        source_type = 'remote'
    else:
        raise ValueError('resulting source must be tuple/list or string')

    keyed = is_keyed(widget, data)
    custom_attrs = data_attrs_helper(widget, data, autocomplete_options)
    custom_attrs.update(
        as_data_attrs(
            {
                'source': source,
                'type': source_type,
                # The browser has to know the mode too: in value mode the hidden field
                # holds the typed text, in keyed mode it holds the key of a chosen
                # suggestion and typing invalidates it.
                'keys': keyed,
            }
        )
    )

    input_attrs.update(custom_attrs)
    input_attrs['type'] = 'text'
    key = fetch_autocomplete_key(widget, data)
    if keyed:
        # Named, so the text survives a failed validation. Only here: in value
        # mode the hidden field already carries it.
        input_attrs['name_'] = widget.dottedpath + LABEL_SUFFIX
        text = fetch_autocomplete_label(widget, data, key)
    else:
        text = key
    if text:
        input_attrs['value'] = text
    elif data.extracted is not UNSET:
        # Submitted and empty: the attribute stays, empty. Left to
        # ``input_attributes_common`` it would hold the extractor's dict, which
        # renders as its repr.
        input_attrs['value'] = ''
    # Otherwise untouched - no request, no value, no attribute, as before.
    input_tag = tag('input', **input_attrs)
    value_attrs = {
        'type': 'hidden',
        # Was hardcoded empty, which made every preset unreachable: an edit form
        # rendered the field blank and a failed validation dropped what had been
        # selected.
        'value': key,
        'name_': widget.dottedpath,
        'id': cssid(widget, 'input'),
        'class_': 'autocomplete-result',
    }
    value_tag = tag('input', **value_attrs)
    return tag(
        'div',
        input_tag,
        value_tag,
        **{'class': cssclasses(widget, data, classattr='wrapper_class')},
    )


def autocomplete_extractor(widget, data):
    """The dict contract, unchanged - ``label`` is added in keyed mode."""
    extracted = {'value': data.extracted}
    if is_keyed(widget, data):
        label_path = widget.dottedpath + LABEL_SUFFIX
        extracted['label'] = data.request.get(label_path, '')
    return extracted


factory.register(
    'autocomplete',
    extractors=[generic_extractor, generic_required_extractor, autocomplete_extractor],
    edit_renderers=[input_generic_renderer, autocomplete_renderer],
    display_renderers=[generic_display_renderer],
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

factory.defaults['autocomplete.keys'] = None
factory.doc['props']['autocomplete.keys'] = """\
Flag whether ``value``, source and extracted data carry key/label pairs rather
than plain values. Either all three do or none of them does.

``None`` infers: a local source of pairs is keyed, anything else is not. A
remote source cannot be judged here - the server does not know what the
endpoint answers - so it has to be told.

In keyed mode the visible input is named ``<dotted>.label`` and carries the
label while the hidden one carries the key, mirroring the reference browser.
"""

factory.defaults['autocomplete.lookup'] = None
factory.doc['props']['autocomplete.lookup'] = """\
Callback accepting the key as argument, returning its label. Used in keyed mode
when the form does not carry a label yet - the first render of an edit form,
where the application stored the identity alone. Same name and signature as
``reference.lookup``, and read off the widget attributes the same way, so a
YAML ``expr:`` cannot deliver it: that produces a ``(widget, data)`` callable.
From YAML, pass the value as a ``(key, label)`` pair instead.
"""

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
