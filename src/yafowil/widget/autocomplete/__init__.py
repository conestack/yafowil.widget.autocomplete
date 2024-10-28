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
    resource='default/widget.js',
    compressed='default/widget.min.js'
))
resources.add(wr.StyleResource(
    name='yafowil-autocomplete-css',
    resource='default/widget.css'
))

# B/C resources ##############################################################

js = [{
    'group': 'yafowil.widget.autocomplete.common',
    'resource': 'default/widget.js',
    'order': 21,
}]
css = [{
    'group': 'yafowil.widget.autocomplete.common',
    'resource': 'default/widget.css',
    'order': 21,
}]


##############################################################################
# Bootstrap 5
##############################################################################

# webresource ################################################################
bootstrap5_js = wr.ScriptResource(
    name='yafowil-autocomplete-js',
    depends='jquery-js',
    resource='bootstrap5/widget.js',
    compressed='bootstrap5/widget.min.js'
)
bootstrap5_resources = wr.ResourceGroup(
    name='yafowil.widget.autocomplete',
    directory=resources_dir,
    path='yafowil-autocomplete'
)
bootstrap5_resources.add(bootstrap5_js)
bootstrap5_resources.add(wr.StyleResource(
    name='yafowil-autocomplete-css',
    directory=os.path.join(resources_dir, 'bootstrap5'),
    path='yafowil-autocomplete/bootstrap5',
    resource='widget.css'
))

# B/C resources ##############################################################

bootstrap5_css = [{
    'group': 'yafowil.widget.autocomplete.common',
    'resource': 'bootstrap5/widget.css',
    'order': 20,
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

    # Bootstrap 5
    factory.register_theme(
        ['bootstrap5'],
        widget_name,
        resources_dir,
        js=bootstrap5_js,
        css=bootstrap5_css
    )

    factory.register_resources(
        ['bootstrap5'],
        widget_name,
        bootstrap5_resources
    )
