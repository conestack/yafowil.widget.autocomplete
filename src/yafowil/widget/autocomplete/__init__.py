import os 

def register():
    import widget
    
def get_resource_dir():
    return os.path.join(os.path.dirname(__file__), 'resources')
    
def get_js():
    return ['widget.js']