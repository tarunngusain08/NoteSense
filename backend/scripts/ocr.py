#!/usr/bin/env python3
import sys
import os
import logging
import pathlib

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s',
                    handlers=[
                        logging.FileHandler("/tmp/ocr_debug.log"),
                        logging.StreamHandler(sys.stderr)
                    ])

try:
    import pytesseract
    from PIL import Image
    import language_tool_python  # Grammar correction
    import spellchecker  # Spell checking
except ImportError as e:
    logging.error(f"Import Error: {e}")
    print(f"Import Error: {e}")
    sys.exit(1)

def correct_grammar(text):
    """
    Correct grammar using LanguageTool with fallback
    """
    try:
        # Additional logging for Java and LanguageTool debugging
        # logging.info(f"Java Home: {os.environ.get('JAVA_HOME', 'Not Set')}")
        # logging.info(f"Java Path: {os.environ.get('PATH', 'Not Set')}")
        
        # Try to initialize LanguageTool
        tool = language_tool_python.LanguageTool('en-US')
        
        # If initialization succeeds, attempt correction
        corrected_text = tool.correct(text)
        return corrected_text
    except Exception as e:
        # Log detailed error information
        logging.error(f"Grammar correction error: {e}")
        logging.error(f"Java executable: {sys.executable}")
        
        # Fallback to original text
        return text

def spell_check_and_correct(text):
    """
    Perform spell checking and correction with comprehensive error handling
    """
    try:
        # Validate input
        if not text or not isinstance(text, str):
            logging.warning("Invalid input for spell checking")
            return text

        # Initialize spell checker
        checker = spellchecker.SpellChecker()
        
        # Split text into words
        words = text.split()
        
        # Robust correction with comprehensive type checking
        corrected_words = []
        for word in words:
            # Ensure word is a string
            word_str = str(word)
            
            # Correct misspelled words
            try:
                corrected_word = checker.correction(word_str)
                corrected_words.append(corrected_word if corrected_word else word_str)
            except Exception as e:
                logging.warning(f"Spell check failed for word '{word_str}': {e}")
                corrected_words.append(word_str)
        
        return ' '.join(corrected_words)
    except Exception as e:
        logging.error(f"Comprehensive spell checking error: {e}")
        return text

def extract_and_enrich_text(image_path):
    try:
        # Convert to absolute path and resolve any symlinks
        image_path = str(pathlib.Path(image_path).resolve())
        
        # logging.info(f"Attempting to process image: {image_path}")
        
        if not os.path.exists(image_path):
            logging.error(f"Image file not found: {image_path}")
            return f"Error: Image file not found at {image_path}"

        # Extract text using Tesseract
        image = Image.open(image_path)
        raw_text = pytesseract.image_to_string(image)
        
        # Validate raw text
        if not raw_text or not isinstance(raw_text, str):
            logging.warning("No text extracted from image")
            return "No text could be extracted"
        
        # Enrich text with comprehensive error handling
        try:
            # Spell check first
            spell_checked_text = spell_check_and_correct(raw_text)
            
            # Then grammar correction (with fallback)
            grammar_corrected_text = correct_grammar(spell_checked_text)
        except Exception as e:
            logging.error(f"Text enrichment failed: {e}")
            grammar_corrected_text = raw_text
        
        # logging.info(f"Successfully processed image: {image_path}")
        # logging.info(f"Raw Text: {raw_text}")
        # logging.info(f"Enriched Text: {grammar_corrected_text}")
        
        return grammar_corrected_text.strip()
    except Exception as e:
        logging.error(f"OCR Enrichment Error: {str(e)}")
        return f"OCR Enrichment Error: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        logging.error("No image path provided")
        print("Please provide an image file path")
        sys.exit(1)
    
    image_path = sys.argv[1]
    result = extract_and_enrich_text(image_path)
    print(result)