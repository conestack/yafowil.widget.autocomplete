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
                    for (var idx=0; idx<rawparams.length; idx++) {
                        var pair = rawparams[idx].split(',');
                        var value = pair[1].trim();
                        if (!isNaN(value)) { value = parseInt(value); };
                        if (value=='True') { value = true; };
                        if (value=='False') { value = false; };
                        key = pair[0].trim();
                        if (key == 'type') {
                            sourcetype = value; 
                        } else {
                            params[key] = value;
                        };                
                    };        
                    params['source'] = elem.find('.autocomplete-source').text();
                    if (sourcetype=='local') {
                        params['source'] = params['source'].split('|');
                    };            
                    elem.find("input").autocomplete(params);
                });
            }
        }
    });
    
})(jQuery);