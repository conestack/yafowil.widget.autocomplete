def register():
    import widget
    
def get_resource_dir():
    return os.path.join(os.path.basedir(__file__), 'resources')
    
def get_js():
    return ['widget.js']