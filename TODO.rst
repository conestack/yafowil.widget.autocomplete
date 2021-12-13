TODO
////

[ ] - implement lookup_factory from cone.maps (-> lookup_callback)

[X] - parse_source: rename val to term
    [ ] - use indexOf instead of current solution (indexOf term > -1)

[ ] - select() input value in widget, not in suggestion (trigger from suggestion)

[ ] - keyboard events: Esc, Tab, Page up / Page down

[ ] - suggestion.active: make into property (getter/setter)

[ ] - function unselect_all

[X] - read opts in intialize - return opts object for easier parsing in future

[X] - data {term: request.term}

[X] - remove suggestion.unload (obsolete)

[X] - move Suggestion class above Widget Class and rename to AutocompleteSuggestion

[X] - ac_widget: rename to ac or widget

[X] - rename dd to dd_elem, and similar _elem !!

[X] - name all handlers with _handle!

[X] - rename .suggestion to .autocomplete-suggestion