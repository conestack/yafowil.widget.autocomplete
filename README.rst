This is a **autocomplete widget** for for `YAFOWIL
<http://pypi.python.org/pypi/yafowil>`_ - Yet Another Form WIdget Library.

It utilizes/integrates `jquery.ui.autocomplete
<http://docs.jquery.com/UI/Autocomplete>`_ for/in YAFOWIL providing an
autocomplete function on a text input.


Usage
=====

The autocomplete widget takes the properties:

minLength
    Minimum length of string before complete starts, default=1.

delay
    Delay after last key-down before complete starts in milliseconds,
    default=300.

source
    Data to be uses for autocomplete. Either a list of strings, a url
    (string) to be used to get a JSON response from or a JavaScript callback
    function. JSON response is expected to be either a list of strings or a
    list of dicts with keys ``id`` and ``label``. ``id`` is used for the
    complete and as value while ``label`` is shown in the dropdown. If
    JavaScript callback desired, prefix source property with ``javascript:``,
    it will be resolved to callback function.


Examples::

    form['mycomplete'] = factory('autocomplete', props={
        'value': '',
        'source': ['foo', 'bar', 'baz'],
        'minLength': 3,
        'delay': 500})
    
    form['mycomplete'] = factory('autocomplete', props={
        'value': '',
        'source': 'http://example.com/source_url',
        'minLength': 3,
        'delay': 500})
    
    form['mycomplete'] = factory('autocomplete', props={
        'value': '',
        'source': 'javascript:myfancyjs.callback',
        'minLength': 3,
        'delay': 500})


Example
=======

To see this widget in action visit
`demo.yafowil.info <http://demo.yafowil.info/++widget++yafowil.widget.autocomplete/index.html>`_
or install `yafowil.demo <https://gitub.com/bluedynamics/yafowil.demo>`_ on your
computer.

Source Code
===========

The sources are in a GIT DVCS with its main branches at
`github <http://github.com/bluedynamics/yafowil.widget.autocomplete>`_.

We'd be happy to see many forks and pull-requests to make YAFOWIL even better.


Contributors
============

- Jens Klein <jens [at] bluedynamics [dot] com>
