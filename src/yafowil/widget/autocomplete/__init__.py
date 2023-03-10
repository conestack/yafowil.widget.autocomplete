from yafowil.base import factory
from yafowil.utils import entry_point
import os
import webresource as wr


resources_dir = os.path.join(os.path.dirname(__file__), 'resources')


##############################################################################
# Default
##############################################################################

# webresource ################################################################

resources = wr.ResourceGroup(
    name='yafowil.widget.autocomplete',
    directory=resources_dir,
    path='yafowil-autocomplete'
)
resources.add(wr.ScriptResource(
    name='yafowil-autocomplete-js',
    depends='jquery-js',
    resource='widget.js',
    compressed='widget.min.js'
))
resources.add(wr.StyleResource(
    name='yafowil-autocomplete-css',
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

    widget_name = 'yafowil.widget.autocomplete'

    # Default
    factory.register_theme(
        'default',
        widget_name,
        resources_dir,
        js=js,
        css=css
    )
    factory.register_resources('default', widget_name, resources)
