#!/usr/bin/env python3
import sys
import os

print("Python Path:", sys.executable)
print("Current Directory:", os.getcwd())
print("Python Version:", sys.version)

try:
    import pytesseract
    from PIL import Image
    print("Pytesseract Version:", pytesseract.__version__)
except ImportError as e:
    print(f"Import Error: {e}")
    sys.exit(1)

if len(sys.argv) < 2:
    print("Please provide an image path")
    sys.exit(1)

image_path = sys.argv[1]
print(f"Attempting to process image: {image_path}")

try:
    image = Image.open(image_path)
    text = pytesseract.image_to_string(image)
    print("Extracted Text:", text.strip())
except Exception as e:
    print(f"Processing Error: {e}")
    sys.exit(1)