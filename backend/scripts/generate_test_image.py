from PIL import Image, ImageDraw, ImageFont
import os

def create_test_image(text="Hello, OCR Test!", filename="test_ocr_image.png"):
    # Create a new image with a white background
    image = Image.new('RGB', (400, 200), color='white')
    
    # Get a drawing context
    draw = ImageDraw.Draw(image)
    
    # Use a default font
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 36)
    except IOError:
        font = ImageFont.load_default()
    
    # Draw the text
    draw.text((50, 80), text, fill='black', font=font)
    
    # Save the image
    script_dir = os.path.dirname(os.path.abspath(__file__))
    full_path = os.path.join(script_dir, filename)
    image.save(full_path)
    
    print(f"Test image created at: {full_path}")
    return full_path

if __name__ == "__main__":
    create_test_image()