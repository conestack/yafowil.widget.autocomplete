import os
from yafowil import loader
import yafowil.webob
from yafowil.base import factory
from yafowil.utils import tag
from yafowil.controller import Controller
import yafowil.widget.autocomplete
from webob import Request, Response

address, port = '127.0.0.1', 8080 
url = 'http://%s:%s/' % (address, port)

def store(widget, data):
    pass 
    
def next(request):
    return url

def javascript_response(environ, start_response, response):
    dir = os.path.dirname(__file__)
    with open(os.path.join(dir, '..', 'resources', 'widget.js')) as js:
        response.write(js.read())
    response.content_type = 'text/javascript'
    return response(environ, start_response)

def json_response(environ, start_response, response):
    response.write('JSON')
    return response(environ, start_response)

def application(environ, start_response):
    request = Request(environ)
    response = Response()
    if environ['PATH_INFO'] == '/ywa.js':
        return javascript_response(environ, start_response, response)
    if environ['PATH_INFO'] == '/ywa.json':
        return json_response(environ, start_response, response)
    jq = tag('script', ' ',
             src='https://ajax.googleapis.com/ajax/libs/jquery/1.4.4/jquery.js',
             type='text/javascript')
    jqui = tag('script', ' ', 
               src='https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.6/jquery-ui.js',
               type='text/javascript')
    ywa = tag('script', ' ',
              src='%sywa.js' % url,
              type='text/javascript')
    head = tag('head', jq, jqui, ywa)
    h1 = tag('h1', 'YAFOWIL Widget Autocomplete Example')
    form = factory(u'form', name='yqaexample', props={
        'action': url})
    form['local'] = factory('field:label:error:autocomplete', props={
        'label': 'Enter some text (local)',
        'value': '',
        'source': ['foo', 'bar', 'baz']})
#    form['local'] = factory('field:label:error:autocomplete', props={
#        'label': 'Enter some text (remote)',
#        'value': '',
#        'required': True})
    form['submit'] = factory('field:submit', props={        
        'label': 'submit',
        'action': 'save',
        'handler': store,
        'next': next})
    controller = Controller(form, request)
    body = tag('body', h1, controller.rendered)
    html = tag('html', head, body)
    from yafowil.widget.autocomplete.tests import prettyxml
    print prettyxml(html)
    response.write(html)
    return response(environ, start_response)
    
def run():
    from wsgiref.simple_server import make_server
    server = make_server(address, port, application)
    server.serve_forever()
    
if __name__ == '__main__':                                   
    run()                  