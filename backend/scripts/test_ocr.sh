#!/bin/bash

# Navigate to the script's directory
cd "$(dirname "$0")"

# Activate virtual environment
source venv/bin/activate

# Generate test image
python3 generate_test_image.py

# Run OCR on the test image
python3 ocr.py test_ocr_image.png

# Deactivate virtual environment
deactivate