from node.utils import UNSET
from yafowil.base import ExtractionError
from yafowil.base import factory
from yafowil.compat import IS_PY2
from yafowil.tests import YafowilTestCase
from yafowil.tests import fxml
import yafowil.loader


if not IS_PY2:
    from importlib import reload


class TestAutocompleteWidget(YafowilTestCase):

    def setUp(self):
        super(TestAutocompleteWidget, self).setUp()
        from yafowil.widget.autocomplete import widget
        reload(widget)

    def test_source_is_string(self):
        # Render plain, source is string
        widget = factory(
            'autocomplete',
            name='root',
            props={
                'source': 'http://www.foo.bar/baz'
            })
        self.check_output("""
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
        self.check_output("""
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
        self.check_output("""
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

        self.check_output("""
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
        err = self.expect_error(
            ValueError,
            widget
        )
        self.assertEqual(str(err), 'resulting source must be tuple/list or string')


if __name__ == '__main__':
    unittest.main()                                          # pragma: no cover
