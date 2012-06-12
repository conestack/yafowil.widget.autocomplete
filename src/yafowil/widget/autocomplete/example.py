import os
import json
from yafowil.base import factory
from webob import Response

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

<pre>write me</pre>
"""

DOC_PART2 = """\
Autocomplete with dynamic json vocabulary
-----------------------------------------

<pre>write me</pre>
"""

def get_example():
    part1 = factory(u'fieldset', name='yafowilwidgetautocompletelocal')
    part1['local'] = factory('field:label:error:autocomplete', props={
          'label': 'Enter some text (local, lorem ipsum)',
          'value': '',
          'source': lipsum})
    part2 = factory(u'fieldset', name='yafowilwidgetautocompletejson')
    part2['remote'] = factory('field:label:error:autocomplete', props={
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
