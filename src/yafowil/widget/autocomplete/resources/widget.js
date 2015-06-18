/* 
 * yafowil autocomplete widget
 * 
 * Requires: jquery ui autocomplete
 * Optional: bdajax
 */

if (typeof(window['yafowil']) == "undefined") yafowil = {};

(function($) {

    $(document).ready(function() {
        // initial binding
        yafowil.autocomplete.binder();
        
        // add after ajax binding if bdajax present
        if (typeof(window['bdajax']) != "undefined") {
            $.extend(bdajax.binders, {
                autocomplete_binder: yafowil.autocomplete.binder
            });
        }
        
        // add binder to yafowil.widget.array hooks
        if (typeof(window.yafowil['array']) != "undefined") {
            $.extend(yafowil.array.hooks.add, {
                autocomplete_binder: yafowil.autocomplete.binder
            });
        }
    });
    
    $.extend(yafowil, {
        
        autocomplete: {
            
            binder: function(context) {
                $('.yafowil-widget-autocomplete', context).each(function () {
                    var elem = $(this);
                    var rawparams = elem
                        .find('.autocomplete-params')
                        .text()
                        .split('|');
                    var params = new Array();
                    for (var idx=0; idx < rawparams.length; idx++) {
                        var pair = rawparams[idx].split(',');
                        var value = pair[1].replace(/^\s+|\s+$/g, "");
                        if (!isNaN(value)) {
                            value = parseInt(value);
                        }
                        if (value == 'True') {
                            value = true;
                        }
                        if (value == 'False') {
                            value = false;
                        }
                        key = pair[0].replace(/^\s+|\s+$/g, "");
                        if (key == 'type') {
                            sourcetype = value; 
                        } else {
                            params[key] = value;
                        }
                    }
                    var source = elem.find('.autocomplete-source').text();
                    if (source.indexOf('javascript:') == 0) {
                        source = source.substring(11, source.length);
                        source = source.split('.');
                        if (!source.length) {
                            throw "No source path found.";
                        }
                        var ctx = window;
                        var name;
                        for (var idx in source) {
                            name = source[idx];
                            if (typeof(ctx[name]) == "undefined") {
                                throw "'" + name + "' not found.";
                            }
                            ctx = ctx[name];
                        }
                        source = ctx;
                    }
                    params['source'] = source;
                    if (sourcetype == 'local') {
                        params['source'] = params['source'].split('|');
                    }
                    elem.find("input").autocomplete(params);
                });
            }
        }
    });
    
})(jQuery);