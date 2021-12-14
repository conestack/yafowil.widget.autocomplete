TODO
////

[X] - fix input val with toUppercase

[X] - throw errors if src not found

[-] - set defaults

[X] - implement lookup_factory from cone.maps (-> lookup_callback)

[X] - keyboard events: Esc, Tab, Page up / Page down
    [~] - Page up / down: add max height, page scroll

[X] - parse_source: rename val to term
    [X] - use indexOf instead of current solution (indexOf term > -1)

[X] - select() input value in widget, not in suggestion (trigger from suggestion)

[X] - suggestion.active: make into property (getter/setter)

[X] - function unselect_all

[X] - read opts in intialize - return opts object for easier parsing in future

[X] - data {term: request.term}

[X] - remove suggestion.unload (obsolete)

[X] - move Suggestion class above Widget Class and rename to AutocompleteSuggestion

[X] - ac_widget: rename to ac or widget

[X] - rename dd to dd_elem, and similar _elem !!

[X] - name all handlers with _handle!

[X] - rename .suggestion to .autocomplete-suggestion
