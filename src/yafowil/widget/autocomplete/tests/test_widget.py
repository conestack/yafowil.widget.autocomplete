from node.utils import UNSET
from yafowil.base import ExtractionError
from yafowil.base import factory
from yafowil.compat import IS_PY2
from yafowil.tests import fxml
from yafowil.tests import YafowilTestCase
import os
import unittest


if not IS_PY2:
    from importlib import reload


def np(path):
    return path.replace('/', os.path.sep)


class TestAutocompleteWidget(YafowilTestCase):

    def setUp(self):
        super(TestAutocompleteWidget, self).setUp()
        from yafowil.widget import autocomplete
        from yafowil.widget.autocomplete import widget
        reload(widget)
        autocomplete.register()

    def test_source_is_string(self):
        # Render plain, source is string
        widget = factory(
            'autocomplete',
            name='root',
            props={
                'source': 'http://www.foo.bar/baz'
            })
        self.checkOutput("""
        <div class="yafowil-widget-autocomplete">
          <input class="autocomplete" id="input-root" name="root" type="text"/>
          <div class="autocomplete-source hiddenStructure">http://www.foo.bar/baz</div>
          <div class="autocomplete-params hiddenStructure">delay,300|minLength,1|type,remote</div>
        </div>
        """, fxml(widget()))

    def test_source_is_list(self):
        # Render plain, source is list
        widget = factory(
            'autocomplete',
            name='root',
            props={
                'source': ['foo', 'bar']
            })
        self.checkOutput("""
        <div class="yafowil-widget-autocomplete">
          <input class="autocomplete" id="input-root" name="root" type="text"/>
          <div class="autocomplete-source hiddenStructure">foo|bar</div>
          <div class="autocomplete-params hiddenStructure">delay,300|minLength,1|type,local</div>
        </div>
        """, fxml(widget()))

    def test_source_is_callable(self):
        # Render plain, source is callable
        def test_source(widget, data):
            return 'http://from.callable/'

        widget = factory(
            'autocomplete',
            name='root',
            props={
                'source': test_source
            })
        self.checkOutput("""
        <div class="yafowil-widget-autocomplete">
          <input class="autocomplete" id="input-root" name="root" type="text"/>
          <div class="autocomplete-source hiddenStructure">http://from.callable/</div>
          <div class="autocomplete-params hiddenStructure">delay,300|minLength,1|type,remote</div>
        </div>""", fxml(widget()))

    def test_extraction(self):
        def test_source(widget, data):
            return 'http://from.callable/'

        widget = factory(
            'autocomplete',
            name='root',
            props={
                'source': test_source
            })
        data = widget.extract({'root': 'abc'})
        self.assertEqual(
            [data.name, data.value, data.extracted, data.errors],
            ['root', UNSET, 'abc', []]
        )

        widget = factory(
            'error:autocomplete',
            name='root',
            props={
                'source': test_source,
                'required': 'Autocomplete widget is required'
            })
        data = widget.extract({'root': ''})
        error = ExtractionError('Autocomplete widget is required')
        self.assertEqual(
            [data.name, data.value, data.extracted, data.errors],
            ['root', UNSET, '', [error]]
        )

        self.checkOutput("""
        <div class="error">
          <div class="errormessage">Autocomplete widget is required</div>
          <div class="yafowil-widget-autocomplete">
            <input class="autocomplete required" id="input-root" name="root"
                   required="required" type="text" value=""/>
            <div class="autocomplete-source hiddenStructure">http://from.callable/</div>
            <div class="autocomplete-params hiddenStructure">delay,300|minLength,1|type,remote</div>
          </div>
        </div>
        """, fxml(widget(data)))

    def test_invalid_source_type(self):
        widget = factory(
            'autocomplete',
            name='root',
            props={
                'source': None
            })
        with self.assertRaises(ValueError) as arc:
            widget()
        self.assertEqual(
            str(arc.exception),
            'resulting source must be tuple/list or string'
        )

    def test_resources(self):
        factory.theme = 'default'
        resources = factory.get_resources('yafowil.widget.autocomplete')
        self.assertTrue(
            resources.directory.endswith(np('/autocomplete/resources'))
        )
        self.assertEqual(resources.name, 'yafowil.widget.autocomplete')
        self.assertEqual(resources.path, 'yafowil-autocomplete')

        scripts = resources.scripts
        self.assertEqual(len(scripts), 1)

        self.assertTrue(
            scripts[0].directory.endswith(np('/autocomplete/resources/default'))
        )
        self.assertEqual(scripts[0].path, 'yafowil-autocomplete/default')
        self.assertEqual(scripts[0].file_name, 'widget.min.js')
        self.assertTrue(os.path.exists(scripts[0].file_path))

        styles = resources.styles
        self.assertEqual(len(styles), 1)

        self.assertTrue(
            styles[0].directory.endswith(np('/autocomplete/resources/default'))
        )
        self.assertEqual(styles[0].path, 'yafowil-autocomplete/default')
        self.assertEqual(styles[0].file_name, 'widget.min.css')
        self.assertTrue(os.path.exists(styles[0].file_path))


if __name__ == '__main__':
    unittest.main()
