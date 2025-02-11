import sys
import easyocr
import json
import traceback
import os

def perform_ocr(image_path):
    try:
        # Disable progress bars
        os.environ['EASYOCR_DISABLE_PROGRESS_BAR'] = 'True'
        reader = easyocr.Reader(['en'], verbose=False)
        results = reader.readtext(image_path)
        text = ' '.join([result[1] for result in results])
        return {'success': True, 'text': text}
    except Exception as e:
        return {'success': False, 'error': str(e), 'traceback': traceback.format_exc()}

if __name__ == '__main__':
    try:
        image_path = sys.argv[1]
        result = perform_ocr(image_path)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e), 'traceback': traceback.format_exc()})) 