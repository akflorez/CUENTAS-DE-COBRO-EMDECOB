import os
from PIL import Image

def crop_signature():
    try:
        # Get path to the image
        current_dir = os.path.dirname(os.path.abspath(__file__))
        firma_path = os.path.join(current_dir, 'public', 'assets', 'firma.png')
        
        print(f"Reading image from: {firma_path}")
        
        # Open the image
        img = Image.open(firma_path)
        width, height = img.size
        print(f"Original size: {width}x{height}")
        
        # Calculate cropping area (left, upper, right, lower)
        # We want to keep the top 63%
        crop_height = int(height * 0.63)
        cropped_img = img.crop((0, 0, width, crop_height))
        
        print(f"Cropped size: {width}x{crop_height}")
        
        # Save it back
        cropped_img.save(firma_path)
        print("Image cropped and saved successfully.")
        
    except Exception as e:
        print(f"Error cropping image: {e}")

if __name__ == "__main__":
    crop_signature()
