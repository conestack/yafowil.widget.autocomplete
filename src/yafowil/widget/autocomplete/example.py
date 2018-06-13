from yafowil.base import factory
from yafowil.compat import IS_PY2
import json
import os

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
    return {'body': json.dumps(data),
            'header': [('Content-Type', 'application/json')]
    }


def json_data(term):
    data = lipsum
    if term:
        data = [_ for _ in data if _.startswith(term)]
    return data


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
    routes = {
        'yafowil.widget.autocomplete.json': json_response,
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
    }]
