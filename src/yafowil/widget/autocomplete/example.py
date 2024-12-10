from yafowil.base import factory
from yafowil.compat import IS_PY2
import json


if IS_PY2:
    from urlparse import urlparse
    from urlparse import parse_qs
else:
    from urllib.parse import urlparse
    from urllib.parse import parse_qs


lipsum = """Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do
eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident,
sunt in culpa qui officia deserunt mollit anim id est laborum."""
lipsum = sorted(set(lipsum.lower().replace('.', '').replace(',', '').split()))


def json_response(url):
    purl = urlparse(url)
    qs = parse_qs(purl.query)
    data = json_data(qs.get('term', [''])[0])
    return {
        'body': json.dumps(data),
        'header': [('Content-Type', 'application/json')]
    }


def json_data(term):
    data = lipsum
    if term:
        data = [_ for _ in data if _.startswith(term)]
    return data


actions_source = [
    {
        'id': 'default',
        'title': 'Default Suggestion'
    },
    {
        'id': 'custom',
        'title': 'Custom Alert Item',
        'ignore_filter': True,
        'factory': 'yafowil_demo.CustomSuggestion'
    },
    'String Suggestion'
]


def json_response_actions(url):
    purl = urlparse(url)
    qs = parse_qs(purl.query)
    data = actions_json_data(qs.get('term', [''])[0])
    return {
        'body': json.dumps(data),
        'header': [('Content-Type', 'application/json')]
    }


def actions_json_data(term):
    filtered_data = []

    for item in actions_source:
        if isinstance(item, dict):
            title = item['title']
            if title.lower().startswith(term.lower()) or \
               ('ignore_filter' in item and item['ignore_filter'] == True):
                filtered_data.append(item)
        else:
            if item.lower().startswith(term.lower()):
                filtered_data.append(item)
    return filtered_data



DOC_STATIC = """\
Autocomplete with static vocabulary
-----------------------------------

Autocomplete can make use of a static vocabulary source. Here words of blind
text Lorem Ipsum are used. First the static list of words is generated

.. code-block:: python

    lipsum = '''Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do
    eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
    veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
    commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit
    esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
    cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id
    est laborum.'''
    lipsum = sorted(set(lipsum.lower().replace('.', '').replace(',', '').split()))

Next, the field is defined as

.. code-block:: python

    field = factory('#field:autocomplete', props={
        'label': 'Enter some text (local, lorem ipsum)',
        'value': '',
        'source': lipsum,
    })
"""

DOC_JSON = """\
Autocomplete with dynamic json vocabulary
-----------------------------------------

Instead of static lists autocomplete may ask the server for a list of words
matching a given term. The source is a string and as such interpreted as a
absolute or relative url

.. code-block:: python

    field = factory('#field:autocomplete', props={
        'label': 'Enter some text (remote listdir)',
        'value': '',
        'source': 'yafowil.widget.autocomplete.json',
        'minLength': 1,
    })

The server answers with a JSON response, here the example does it using WSGI
and ``webob`` way. This code needs modification depending on the framework
used

.. code-block:: python

    def json_response(environ, start_response):
        data = lipsum
        if environ['QUERY_STRING'].startswith('term='):
            qsts = environ['QUERY_STRING'][5:]
            data = [_ for _ in data if _.startswith(qsts)]
        response = Response(content_type='application/json',
                            body=json.dumps(data))
        return response(environ, start_response)
"""

DOC_ACTIONS = """\
Suggestion Factories and Data types
-----------------------------------

Remote Autocomplete widgets may receive dict-like items. The key 
of the currently selected item will be available in a hidden input field.

This also allows the Autocomplete Widget to initialize Suggestions using factories.
Setting the 'ignore_filter' flag won't validate a Suggestion client-side,
as long as it is present in the data returned from server.

Item types can be mixed and matched in one widget. Make sure to adjust your
backend validation method for filtering multiple types.

The following example shows how to extend or create your own Suggestion class
based on yafowil.widget.autocomplete:

.. code-block:: js

    window.yafowil_demo = { // your desired path
        CustomSuggestion: class CustomSuggestion extends window.yafowil_autocomplete.AutocompleteSuggestion {

            constructor(widget, source, val) {
                super(widget, source, val);
            }

            select() {
                super.select();
                alert('The Suggestion has been selected.');
            }

            compile() {
                super.compile();
                this.elem.css('background-color', '#ffe00057');
            }
        }
    }

Your JSON data should return data formatted similar to the following example:

.. code-block:: json

    [
        {
            'id': 'default',
            'title': 'Default Suggestion'
        },
        {
            'id': 'custom',
            'title': 'Custom Alert Item',
            'ignore_filter': True,
            'factory': 'yafowil_demo.CustomSuggestion'
        },
        'String Suggestion'
    ]

Now initialize your widget:

.. code-block:: python

    field = factory('#field:autocomplete', props={
        'label': 'Enter some text or select an Action',
        'value': '',
        'source': 'yafowil.widget.autocomplete_actions.json',
        'minLength': 1,
    })

"""



def get_example():
    static_ac = factory('#field:autocomplete', name='static', props={
        'label': 'Enter some text (local, lorem ipsum)',
        'value': '',
        'source': lipsum,
    })
    json_ac = factory('#field:autocomplete', name='json', props={
        'label': 'Enter some text (remote listdir)',
        'value': '',
        'source': 'yafowil.widget.autocomplete.json',
        'minLength': 1,
    })
    actions_ac = factory('#field:autocomplete', name='actions', props={
        'label': 'Enter some text or select an Action',
        'value': '',
        'source': 'yafowil.widget.autocomplete_actions.json',
        'minLength': 1,
    })
    routes = {
        'yafowil.widget.autocomplete.json': json_response,
        'yafowil.widget.autocomplete_actions.json': json_response_actions,
    }
    return [{
        'widget': static_ac,
        'doc': DOC_STATIC,
        'title': 'Static autocomplete',
    }, {
        'widget': json_ac,
        'routes': routes,
        'doc': DOC_JSON,
        'title': 'JSON data autocomplete',
    }, {
        'widget': actions_ac,
        'doc': DOC_ACTIONS,
        'title': 'Suggestion Factories and Data types',
    }]
