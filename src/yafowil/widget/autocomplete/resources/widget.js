(function($) {

    $(document).ready(function() {
        
        $('.yafowil-widget-autocomplete').each(function () {
            var jqthis = $(this);
            var rawparams = jqthis.find('.autocomplete-params').text().split('|');
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
            params['source'] = jqthis.find('.autocomplete-source').text();
            if (sourcetype=='local') {
                params['source'] = params['source'].split('|');
            };            
            jqthis.find("input").autocomplete(params);
        });
        
    });
    
})(jQuery);