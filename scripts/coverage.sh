#!/bin/sh

set -e

./bin/coverage run \
    --source src/yafowil/widget/autocomplete \
    --omit src/yafowil/widget/autocomplete/example.py \
    -m yafowil.widget.autocomplete.tests
./bin/coverage report
./bin/coverage html
