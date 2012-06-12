import os
import json
from yafowil import loader
from yafowil.base import factory
import yafowil.webob
from yafowil.controller import Controller
from yafowil.tests import fxml
from webob import Request, Response

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

def get_example():
    root = factory(u'fieldset', name='yafowilwidgetautocomplete')
    root['local'] = factory('field:label:error:autocomplete', props={
        'label': 'Enter some text (local, lorem ipsum)',
        'value': '',
        'source': lipsum})
    root['remote'] = factory('field:label:error:autocomplete', props={
        'label': 'Enter some text (remote listdir)',
        'value': '',
        'source': 'yafowil.widget.autocomplete.json',
        'minLength': 1})
    root['submit'] = factory('field:submit', props={
        'label': 'submit',
        'action': 'save',
        'handler': lambda widget, data: None,
        'next': lambda request: url})
    routes = {'yafowil.widget.autocomplete.json': json_response}
    return {'widget': root, 'routes': routes}
