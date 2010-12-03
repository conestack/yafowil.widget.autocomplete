=========================================
jquery.ui.autocomplete widget for YAFOWIL
=========================================

A widget for YAFOWIL providing an autocomplete function on a text input.

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


Contributors
============

- Jens Klein <jens@bluedynamics.com>
