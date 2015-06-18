/* jslint browser: true */
/* global jQuery, yafowil */
/* 
 * yafowil autocomplete widget
 * 
 * Requires: jquery ui autocomplete
 * Optional: bdajax
 */

if (window.yafowil === undefined) {
    window.yafowil = {};
}

(function($, yafowil) {
    "use strict";

    $(document).ready(function() {
        // initial binding
        yafowil.autocomplete.binder();
        
        // add after ajax binding if bdajax present
        if (window.bdajax !== undefined) {
            $.extend(window.bdajax.binders, {
                autocomplete_binder: yafowil.autocomplete.binder
            });
        }
        
        // add binder to yafowil.widget.array hooks
        if (yafowil.array !== undefined) {
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
                    var params = [],
                        idx,
                        sourcetype;
                    for (idx=0; idx < rawparams.length; idx++) {
                        var pair = rawparams[idx].split(',');
                        var value = pair[1].replace(/^\s+|\s+$/g, "");
                        if (!isNaN(value)) {
                            value = parseInt(value);
                        }
                        if (value === 'True') {
                            value = true;
                        }
                        if (value === 'False') {
                            value = false;
                        }
                        var key = pair[0].replace(/^\s+|\s+$/g, "");
                        if (key === 'type') {
                            sourcetype = value; 
                        } else {
                            params[key] = value;
                        }
                    }
                    var source = elem.find('.autocomplete-source').text();
                    if (source.indexOf('javascript:') === 0) {
                        source = source.substring(11, source.length);
                        source = source.split('.');
                        if (!source.length) {
                            throw "No source path found.";
                        }
                        var ctx = window;
                        var name;
                        for (idx in source) {
                            name = source[idx];
                            if (ctx[name] === undefined) {
                                throw "'" + name + "' not found.";
                            }
                            ctx = ctx[name];
                        }
                        source = ctx;
                    }
                    params.source = source;
                    if (sourcetype === 'local') {
                        params.source = params.source.split('|');
                    }
                    elem.find("input").autocomplete(params);
                });
            }
        }
    });
    
})(jQuery, yafowil);
