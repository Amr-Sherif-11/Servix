"""
Remove the dark background from the Servix logo and make it transparent.
"""
from PIL import Image
import math

def remove_dark_background(input_path, output_path, threshold=45, edge_feather=8):
    """
    Remove dark background from logo image.
    
    Args:
        input_path: Path to source image
        output_path: Path to save result
        threshold: Max brightness to consider as "background" (0-255)
        edge_feather: Pixels of feathering at the boundary for smooth edges
    """
    img = Image.open(input_path).convert("RGBA")
    pixels = img.load()
    width, height = img.size
    
    # First pass: identify background vs foreground
    # Dark purple/navy background has low brightness
    mask = Image.new("L", (width, height), 0)  # 0 = transparent, 255 = opaque
    mask_pixels = mask.load()
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            # Calculate perceived brightness
            brightness = 0.299 * r + 0.587 * g + 0.114 * b
            
            # Check if pixel is "dark background"
            # The background is very dark navy/purple
            is_dark = brightness < threshold
            
            # Also check for very dark blue/purple specifically
            is_dark_purple = (r < 50 and g < 40 and b < 70 and brightness < 40)
            
            if is_dark and is_dark_purple:
                mask_pixels[x, y] = 0  # transparent
            elif is_dark and brightness < 25:
                # Very dark pixels are almost certainly background
                mask_pixels[x, y] = 0
            else:
                mask_pixels[x, y] = 255  # opaque
    
    # Second pass: feather edges for smooth transitions
    # Create a distance-based alpha for pixels near the boundary
    from PIL import ImageFilter
    
    # Slight blur on the mask to soften edges
    mask = mask.filter(ImageFilter.GaussianBlur(radius=1.5))
    
    # Apply the mask as alpha channel
    mask_pixels = mask.load()
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            new_alpha = mask_pixels[x, y]
            pixels[x, y] = (r, g, b, new_alpha)
    
    # Crop to content (remove empty transparent borders)
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    
    img.save(output_path, "PNG")
    print(f"Saved transparent logo to: {output_path}")
    print(f"Final size: {img.size[0]}x{img.size[1]}")

if __name__ == "__main__":
    input_file = r"d:\Servix\public\logo.png"
    output_file = r"d:\Servix\public\logo_transparent.png"
    remove_dark_background(input_file, output_file)
