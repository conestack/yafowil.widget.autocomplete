import os
import json
from yafowil.base import factory

lipsum = """Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do
eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident,
sunt in culpa qui officia deserunt mollit anim id est laborum."""
lipsum = sorted(set(lipsum.lower().replace('.', '').replace(',', '').split()))

def json_response(environ, start_response):
    data = os.listdir('.')
    if environ['QUERY_STRING'].startswith('term='):
        data = [_ for _ in data if _.startswith(environ['QUERY_STRING'][5:])]
    response = Response(content_type='application/json', body=json.dumps(data))
    return response(environ, start_response)

DOC_PART1 = """\
Autocomplete with static vocabulary
-----------------------------------

Autocomplete may happen against a static vocabulary source. Here words of blind
text Lorem Ipsum was used. First the static list of wordsis generated

.. code-block:: python

    lipsum = '''Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do
    eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
    veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
    commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit
    esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
    cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id
    est laborum.'''
    lipsum = sorted(set(lipsum.lower().replace('.', '').replace(',', '').split()))

Next field is defined as

.. code-block:: python

    field = factory('field:label:error:autocomplete', props={
                    'label': 'Enter some text (local, lorem ipsum)',
                    'value': '',
                    'source': lipsum})

"""

DOC_PART2 = """\
Autocomplete with dynamic json vocabulary
-----------------------------------------

Instead of static lists autocomplete ay ask the server for a list of words
matching a given term. The source is a string and as such interpreted as a
absolute or relative url

.. code-block:: python

    field = factory('field:label:error:autocomplete', props={
                    'label': 'Enter some text (remote listdir)',
                    'value': '',
                    'source': 'yafowil.widget.autocomplete.json',
                    'minLength': 1})

The server answers with a JSON response, here the example does it using WSGI
and ``webob``` way. This code needs modification depending on the framework
used

.. code-block:: python

    def json_response(environ, start_response):
        data = os.listdir('.')
        if environ['QUERY_STRING'].startswith('term='):
            qsts = environ['QUERY_STRING'][5:]
            data = [_ for _ in data if _.startswith(qsts)]
        response = Response(content_type='application/json',
                            body=json.dumps(data))
        return response(environ, start_response)

"""

def get_example():
    part1 = factory('#field:autocomplete',
          name='autocomplete-1',
          props={
          'label': 'Enter some text (local, lorem ipsum)',
          'value': '',
          'source': lipsum})
    part2 = factory('#field:autocomplete',
          name='autocomplete-2',
          props={
          'label': 'Enter some text (remote listdir)',
          'value': '',
          'source': 'yafowil.widget.autocomplete.json',
          'minLength': 1})
    routes = {'yafowil.widget.autocomplete.json': json_response}
    return [{'widget': part1,
             'doc': DOC_PART1},
            {'widget': part2,
             'routes': routes,
             'doc': DOC_PART2}, ]
