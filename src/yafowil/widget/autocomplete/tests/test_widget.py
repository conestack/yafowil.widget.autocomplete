from importlib import reload
from node.utils import UNSET
from yafowil.base import ExtractionError
from yafowil.base import factory
from yafowil.tests import fxml
from yafowil.tests import YafowilTestCase
import os
import unittest


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
          <input class="autocomplete" data-delay="300" data-keys="false" data-min-length="1" data-source="http://www.foo.bar/baz" data-type="remote" type="text"/>
          <input class="autocomplete-result" id="input-root" name="root" type="hidden" value=""/>
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
          <input class="autocomplete" data-delay="300" data-keys="false" data-min-length="1" data-source="foo|bar" data-type="local" type="text"/>
          <input class="autocomplete-result" id="input-root" name="root" type="hidden" value=""/>
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
          <input class="autocomplete" data-delay="300" data-keys="false" data-min-length="1" data-source="http://from.callable/" data-type="remote" type="text"/>
          <input class="autocomplete-result" id="input-root" name="root" type="hidden" value=""/>
        </div>
        """, fxml(widget()))

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
            ['root', UNSET, {'value': 'abc'}, []]
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
          <div class="required yafowil-widget-autocomplete">
            <input class="autocomplete required" data-delay="300" data-keys="false" data-min-length="1" data-source="http://from.callable/" data-type="remote" required="required" type="text" value=""/>
            <input class="autocomplete-result" id="input-root" name="root" type="hidden" value=""/>
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


class TestAutocompleteValueRoundtrip(YafowilTestCase):
    """A value has to survive rendering, submitting and rendering again.

    The hidden input carrying the form value was rendered with ``value=""``
    unconditionally, so no preset ever reached the browser: an edit form showed
    an empty field, and a failed validation dropped what had been selected. The
    visible input meanwhile received ``str(data.value)``, which after an
    extraction is the extractor's own dict - the user saw its repr.
    """

    def setUp(self):
        super(TestAutocompleteValueRoundtrip, self).setUp()
        from yafowil.widget import autocomplete
        from yafowil.widget.autocomplete import widget
        reload(widget)
        autocomplete.register()

    def _widget(self, **kw):
        props = {'source': 'http://x/'}
        props.update(kw.pop('props', {}))
        return factory('autocomplete', name='root', props=props, **kw)

    def test_plain_value_reaches_the_hidden_field(self):
        rendered = self._widget(value='freitext')()
        self.assertIn('name="root" type="hidden" value="freitext"', rendered)
        self.assertIn('type="text" value="freitext"', rendered)

    def test_keyed_value_splits_into_label_and_key(self):
        rendered = self._widget(
            value=('abc', 'Omega GmbH'), props={'keys': True}
        )()
        self.assertIn('name="root.label" type="text" value="Omega GmbH"', rendered)
        self.assertIn('name="root" type="hidden" value="abc"', rendered)

    def test_the_visible_input_is_named_only_in_keyed_mode(self):
        """In value mode the hidden field already carries the text.

        A second named field would post the same string twice, and it would
        change the markup of every existing consumer.
        """
        self.assertNotIn('name="root.label"', self._widget(value='x')())

    def test_a_lookup_resolves_the_label_of_a_bare_key(self):
        """The first render of an edit form: the application stored the id."""
        rendered = self._widget(
            value='abc',
            props={'keys': True, 'lookup': lambda key: f'Label of {key}'},
        )()
        self.assertIn('value="Label of abc"', rendered)
        self.assertIn('name="root" type="hidden" value="abc"', rendered)

    def test_without_a_lookup_the_key_is_shown_rather_than_nothing(self):
        """Degraded, and visibly so - an empty field would look like no value."""
        rendered = self._widget(value='abc', props={'keys': True})()
        self.assertIn('name="root.label" type="text" value="abc"', rendered)

    def test_a_local_source_of_pairs_is_keyed_without_saying_so(self):
        rendered = self._widget(
            value=('a', 'Anton'), props={'source': [('a', 'Anton'), ('b', 'Berta')]}
        )()
        self.assertIn('name="root.label" type="text" value="Anton"', rendered)
        self.assertIn("data-source='a|b'", rendered)

    def test_the_extracted_dict_keeps_its_shape(self):
        widget = self._widget()
        data = widget.extract({'root': 'abc'})
        self.assertEqual(data.extracted, {'value': 'abc'})

    def test_keyed_extraction_adds_the_label(self):
        widget = self._widget(props={'keys': True})
        data = widget.extract({'root': 'abc', 'root.label': 'Omega GmbH'})
        self.assertEqual(
            data.extracted, {'value': 'abc', 'label': 'Omega GmbH'}
        )

    def test_a_failed_validation_shows_the_typed_text_again(self):
        """Not the extractor's dict, and not the key either.

        Half typed input is the normal state of an autocomplete, and throwing
        it away on every validation error is what makes a form tiring.
        """
        widget = self._widget(props={'keys': True, 'required': True})
        request = {'root': '', 'root.label': 'Ome'}
        # Extract first, then render the very data - passing the request to the
        # renderer alone does not extract, it only makes the request available.
        rendered = widget(data=widget.extract(request))
        self.assertIn('value="Ome"', rendered)
        self.assertNotIn("{'value'", rendered)

    def test_a_failed_validation_keeps_a_plain_value(self):
        widget = self._widget()
        rendered = widget(data=widget.extract({'root': 'freitext'}))
        self.assertIn('value="freitext"', rendered)
        self.assertNotIn("{'value'", rendered)

if __name__ == '__main__':
    unittest.main()
