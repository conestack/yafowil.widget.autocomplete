This is a **autocomplete widget** for for `YAFOWIL 
<http://pypi.python.org/pypi/yafowil>`_ - Yet Another Form WIdget Library.

It utilizes/integrates `jquery.ui.autocomplete 
<http://docs.jquery.com/UI/Autocomplete>`_ for/in YAFOWIL providing an 
autocomplete function on a text input.


Usage
=====

The autocomplete widget takes the paramters:

minLength
    Minimum length of string before complete starts, default=1.

delay
    Delay after last key-down before complete starts in milliseconds, 
    default=300.
    
source
    Data to be uses for autocomplete. Either a list of strings or an url 
    (string) to be used to get a JSON response from. JSON response is expected 
    to be either a list of strings or a list of dicts with keys ``id`` and 
    ``label``. ``id`` is used for the complete and as value while ``label`` is 
    shown in the dropdown.  
    
Example::

    form['mycomplete'] = factory('autocomplete', props={
        'value': '',
        'source': ['foo', 'bar', 'baz'],
        'minLength': 3,
        'delay': 500})


Example Application
===================

To run the example application and tests coming with this package run 
`bootstrap <http://python-distribute.org/bootstrap.py>`_ (Python 2.6 or 2.7) 
with a buildout like so:: 

    [buildout]
    parts = gunicorn   
    
    [tests]
    recipe = zc.recipe.testrunner
    eggs = 
        yafowil.widget.autocomplete[test]
    
    [gunicorn]
    recipe = zc.recipe.egg:scripts
    eggs = 
        ${test:eggs}
        gunicorn 
    
Start the application with::

	./bin/gunicorn yafowil.widget.autocomplete.example:app

and connect with your webbrowser to ``http://localhost:8000/``
	
Run the tests with::

    ./bin/tests


Source Code
===========

The sources are in a GIT DVCS with its main branches at 
`github <http://github.com/bluedynamics/yafowil.widget.autocomplete>`_.

We'd be happy to see many forks and pull-requests to make YAFOWIL even better.


Contributors
============

- Jens Klein <jens@bluedynamics.com>
