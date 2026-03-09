import Jimp from 'jimp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function cropSignature() {
  try {
    const firmaPath = path.join(__dirname, 'public', 'assets', 'firma.png');
    console.log('Reading image from:', firmaPath);
    
    // Read the image
    const image = await Jimp.read(firmaPath);
    
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    
    console.log(`Original size: ${width}x${height}`);
    
    const cropHeight = Math.floor(height * 0.63);
    
    image.crop(0, 0, width, cropHeight);
    
    console.log(`Cropped size: ${width}x${cropHeight}`);
    
    // Overwrite the image
    await image.writeAsync(firmaPath);
    console.log('Image cropped and saved successfully.');
  } catch (error) {
    console.error('Error cropping image:', error);
  }
}

cropSignature();
