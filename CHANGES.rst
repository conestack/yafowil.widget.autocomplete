Changes
=======

2.1.1 (unreleased)
------------------

- Sort the imports with ruff (one per line, ``from`` imports first, no
  sections) and format the code with ``ruff format`` (90 characters per line,
  single quotes).
  [rnix]

- Add ``qa.ruff`` domain to Makefile and pin the ruff configuration in
  ``pyproject.toml``, ``make check`` runs ``ruff check``.
  [rnix]

- Drop the Python 2 remnants: ``yafowil.compat`` usage and ``IS_PY2`` branches.
  [rnix]

- Declare ``requires-python = ">=3.10"``.
  [rnix]


2.1.0 (2026-10-24)
------------------

- Ignore a second ``initialize`` on an element that already carries a widget.
  ``initialize`` takes a context, and a context is commonly a parent - an ajax
  reload that replaces one element re-binds its parent, so every widget beside
  the replaced one arrives a second time. The widget stored itself under
  ``elem.data('yafowil-autocomplete')`` already; only the check was missing.
  Without it the handlers are bound twice, the first widget becomes
  unreachable through the data key, and its dropdown stays behind on ``body``.
  [rnix]

- The hidden input carrying the form value renders that value instead of an
  empty string. No preset ever reached the browser before: an edit form showed
  an empty field and a failed validation dropped what had been selected.
  [rnix]

- The visible input no longer renders the extractor's dict after a failed
  validation.
  [rnix]

- Add ``keys`` property for key/label pairs in value, source and extracted
  data. In that mode the visible input is named ``<dotted>.label`` and carries
  the label while the hidden one carries the key, mirroring the reference
  browser of ``cone.app``. Inferred for a local source of pairs, explicit for a
  remote source - the server cannot know what the endpoint answers.
  [rnix]

- Add ``lookup`` property, a callback resolving a key to its label, for the
  first render of an edit form where only the identity was stored. Same name
  and signature as ``reference.lookup``.
  [rnix]

- In value mode the hidden field now follows the typed text. Free input without
  a selection was lost, the visible input has no name there.
  [rnix]


2.0.0 (2026-02-03)
------------------

- Refactor package layout to use ``pyproject.toml`` and implicit namespace packages.
  [rnix]

- Update jQuery to version ``4.0.0-beta.2``.
  [lenadax]

- The widget can now initalize Suggestions using factories (see example.py).
  [lenadax]

- Remote widgets allow receiving of dict-like items (see example.py).
  The key of the currently selected item will be available in a hidden input field.
  [lenadax]

- Implement dark theme for ``Bootstrap5`` dark theme mode.
  [lenadax]

- Use rollup for bundling scss. Use ``make rollup`` to compile js and scss.
  [lenadax]

- Use ``webtestrunner`` instead of ``karma`` for js tests. Use ``make wtr`` to run tests.
  [lenadax]

- Use ``pnpm`` as package manager.
  [lenadax]

- Create Bootstrap5 widget version.
  [lenadax]


2.0a1 (2024-06-02)
------------------

- Extend JS by ``autocomplete_on_array_add`` and ``register_array_subscribers``
  to enable usage in ``yafowil.widget.array``.
  [lenadax]

- Get rid of jQuery UI. Rewrite Jacascript widget using ES6.
  [lenadax]


1.8 (2025-11-03)
----------------

- Pin upper versions of dependencies.
  [lenadax]


1.7 (2018-07-16)
----------------

- Python 3 compatibility.
  [rnix]

- Convert doctests to unittests.
  [rnix]


1.6 (2017-03-01)
----------------

- Add dedicated CSS for ``plone5`` theme provided by ``yafowil.plone``.
  [rnix, 2016-06-28]

- Use ``yafowil.utils.entry_point`` decorator.
  [rnix, 2016-06-28]


1.5.1 (2015-06-25)
------------------

- Resolve JSHint errors and warnings.
  [thet]


1.5 (2015-01-23)
----------------

- Update jquery UI autocomplete to 1.10.3 and use latest jquery ui boostrap
  styles.
  [rnix, 2014-07-05]

1.4.1
-----

- use ``yafowil.utils.attr_value`` wherever possible.
  [rnix, 2012-10-25]

1.4
---

- Add ``generic_required_extractor`` to extraction chain
  [rnix, 2012-07-25]

- Adopt resource providing
  [rnix, 2012-06-12]

- Remove example app
  [rnix, 2012-06-12]

1.3
---

- Support JavaScript callback functions in source attribute
  [rnix, 2011-10-03]

- register autocomplete binder in ``yafowil.widget.array`` hooks if installed
  [rnix, 2011-10-03]

- register plan and depend on yafowil 1.3
  [jensens, 2011-09-30]

1.2
---

- adopt to yafowil 1.2
  [jensens, 2011-09-20]

- resource available in plain Zope2
  [jensens, 2011-09-20]

1.1
---

- adopt to yafowil 1.1
  [rnix, 2011-07-08]

1.0.1
-----

- test coverage
  [rnix, 2011-05-07]

1.0
---

- made it work
  [jensens, 2010-11-24]
