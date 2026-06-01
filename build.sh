#!/bin/bash
# Build Tailwind CSS
cd "$(dirname "$0")"
tailwindcss -i css/input.css -o css/style.css --minify
echo "✓ css/style.css built ($(du -h css/style.css | cut -f1))"
