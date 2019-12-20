#!/bin/sh

set -e

echo ">>> starting genconfig container shell..."

#tail -f /dev/null

nodejs main.js

# run all command line arguments
exec "$@";