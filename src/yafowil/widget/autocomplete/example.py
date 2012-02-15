import os
from simplejson import dumps
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

def javascript_response(environ, start_response):
    response = Response(content_type='text/javascript')
    dir = os.path.dirname(__file__)
    with open(os.path.join(dir, 'resources', 'widget.js')) as js:
        response.write(js.read())
    return response(environ, start_response)

def json_response(environ, start_response):
    data = os.listdir('.')
    if environ['QUERY_STRING'].startswith('term='):
        data = [_ for _ in data if _.startswith(environ['QUERY_STRING'][5:])]
    response = Response(content_type='application/json', body=dumps(data))
    return response(environ, start_response)

def app(environ, start_response):
    url = 'http://%s/' % environ['HTTP_HOST']
    if environ['PATH_INFO'] == '/ywa.js':
        return javascript_response(environ, start_response)
    elif environ['PATH_INFO'] == '/ywa.json':
        return json_response(environ, start_response)
    elif environ['PATH_INFO'] != '/':
        response = Response(status=404)
        return response(environ, start_response)
    form = factory(u'form', name='yqaexample', props={
        'action': url})
    form['local'] = factory('field:label:error:autocomplete', props={
        'label': 'Enter some text (local, lorem ipsum)',
        'value': '',
        'source': lipsum})
    form['remote'] = factory('field:label:error:autocomplete', props={
        'label': 'Enter some text (remote listdir)',
        'value': '',
        'source': '%sywa.json' % url,
        'minLength': 1})
    form['submit'] = factory('field:submit', props={        
        'label': 'submit',
        'action': 'save',
        'handler': lambda widget, data: None,
        'next': lambda request: url})
    controller = Controller(form, Request(environ))
    tag = controller.data.tag
    jq = tag('script', ' ',
             src='https://ajax.googleapis.com/ajax/libs/jquery/1.4.4/jquery.js',
             type='text/javascript')
    jqui = tag('script', ' ', 
               src='https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.6/jquery-ui.js',
               type='text/javascript')
    ywa = tag('script', ' ',
              src='%sywa.js' % url,
              type='text/javascript')
    css = tag("style",
              "@import url(https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.6/themes/base/jquery-ui.css)",
              type='text/css')
    css += tag('style',
              '.hiddenStructure { display: none; }', 
              type='text/css')
    head = tag('head', jq, jqui, ywa, css)
    h1 = tag('h1', 'YAFOWIL Widget Autocomplete Example')
    body = tag('body', h1, controller.rendered)
    response = Response(body=fxml(tag('html', head, body)))
    return response(environ, start_response)