from yafowil.base import factory
from yafowil.utils import entry_point
import os
import webresource as wr


resources_dir = os.path.join(os.path.dirname(__file__), 'resources')


##############################################################################
# Default
##############################################################################

# webresource ################################################################

scripts = wr.ResourceGroup(name='yafowil-autocomplete-scripts')
scripts.add(wr.ScriptResource(
    name='yafowil-autocomplete-js',
    depends='jquery-js',
    directory=resources_dir,
    resource='widget.js',
    compressed='widget.min.js'
))

styles = wr.ResourceGroup(name='yafowil-autocomplete-styles')
styles.add(wr.StyleResource(
    name='yafowil-autocomplete-css',
    directory=resources_dir,
    resource='widget.css'
))

# B/C resources ##############################################################

js = [{
    'group': 'yafowil.widget.autocomplete.common',
    'resource': 'widget.js',
    'order': 21,
}]
css = [{
    'group': 'yafowil.widget.autocomplete.common',
    'resource': 'widget.css',
    'order': 21,
}]


##############################################################################
# Registration
##############################################################################

@entry_point(order=10)
def register():
    from yafowil.widget.autocomplete import widget  # noqa

    # Default
    factory.register_theme(
        'default', 'yafowil.widget.autocomplete', resources_dir,
        js=js, css=css
    )
    factory.register_scripts('default', 'yafowil.widget.autocomplete', scripts)
    factory.register_styles('default', 'yafowil.widget.autocomplete', styles)