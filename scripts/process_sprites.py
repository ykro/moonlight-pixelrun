#!/usr/bin/env python3
"""
Sprite Post-Processor for Moonlight: Pixel Run
- Removes green (#00FF00) chroma key background
- Resizes to display-ready dimensions
- Backgrounds are resized but NOT chroma-keyed
"""

import json
import sys
from pathlib import Path
from PIL import Image
import argparse

SCRIPT_DIR = Path(__file__).parent
SPRITES_DIR = SCRIPT_DIR.parent / "public" / "assets" / "sprites"
PROMPTS_FILE = SCRIPT_DIR / "prompts.json"

# Display sizes (4x-8x of logical size for crisp rendering)
DISPLAY_SIZES = {
    "16x24": (128, 192),
    "20x12": (160, 96),
    "20x24": (160, 192),
    "24x24": (192, 192),
    "28x20": (224, 160),
    "64x80": (256, 320),
    "16x16": (128, 128),
    "180x320": (360, 640),  # Backgrounds at 2x
}

# IDs that are backgrounds (no chroma key removal)
BG_IDS = {"bg_menu", "bg_character_select", "bg_level_select", "bg_las_americas", "bg_hill_reps", "bg_fondo_vh", "bg_game_over"}


def remove_green_bg(img: Image.Image, tolerance: int = 80) -> Image.Image:
    """Remove bright green (#00FF00) chroma key background."""
    img = img.convert("RGBA")
    pixels = img.load()
    width, height = img.size

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            # Detect green-ish pixels: high green, low red, low blue
            if g > 150 and r < (g - 30) and b < (g - 30):
                pixels[x, y] = (0, 0, 0, 0)
            # Also catch near-pure-green with tolerance
            elif (abs(r - 0) < tolerance and
                  abs(g - 255) < tolerance and
                  abs(b - 0) < tolerance):
                pixels[x, y] = (0, 0, 0, 0)

    return img


def clean_edges(img: Image.Image, passes: int = 1) -> Image.Image:
    """Remove semi-transparent green fringe pixels on edges."""
    pixels = img.load()
    width, height = img.size

    for _ in range(passes):
        for y in range(height):
            for x in range(width):
                r, g, b, a = pixels[x, y]
                if a == 0:
                    continue
                # If pixel has strong green tint and is next to transparent pixel
                if g > r + 30 and g > b + 30 and a < 200:
                    # Check if adjacent to transparent
                    has_transparent_neighbor = False
                    for dx, dy in [(-1,0),(1,0),(0,-1),(0,1)]:
                        nx, ny = x+dx, y+dy
                        if 0 <= nx < width and 0 <= ny < height:
                            if pixels[nx, ny][3] == 0:
                                has_transparent_neighbor = True
                                break
                    if has_transparent_neighbor:
                        pixels[x, y] = (0, 0, 0, 0)

    return img


def crop_to_content(img: Image.Image, padding: int = 2) -> Image.Image:
    """Crop to non-transparent content."""
    bbox = img.getbbox()
    if bbox:
        left = max(0, bbox[0] - padding)
        top = max(0, bbox[1] - padding)
        right = min(img.width, bbox[2] + padding)
        bottom = min(img.height, bbox[3] + padding)
        return img.crop((left, top, right, bottom))
    return img


def resize_sprite(img: Image.Image, target_size: tuple, is_bg: bool = False) -> Image.Image:
    """Resize with LANCZOS, center on transparent canvas for sprites."""
    if is_bg:
        # Backgrounds: just resize to fill
        return img.resize(target_size, Image.Resampling.LANCZOS)

    # Sprites: maintain aspect ratio, center on transparent canvas
    orig_ratio = img.width / img.height
    target_ratio = target_size[0] / target_size[1]

    if orig_ratio > target_ratio:
        new_width = target_size[0]
        new_height = int(new_width / orig_ratio)
    else:
        new_height = target_size[1]
        new_width = int(new_height * orig_ratio)

    resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

    result = Image.new("RGBA", target_size, (0, 0, 0, 0))
    x_offset = (target_size[0] - new_width) // 2
    y_offset = (target_size[1] - new_height) // 2
    result.paste(resized, (x_offset, y_offset), resized)

    return result


def process_sprite(sprite_config: dict, force: bool = False) -> bool:
    """Process a single sprite."""
    filename = sprite_config["filename"]
    size_str = sprite_config["size"]
    sprite_id = sprite_config["id"]
    is_bg = sprite_id in BG_IDS

    target_size = DISPLAY_SIZES.get(size_str)
    if not target_size:
        print(f"  ⚠ Unknown size '{size_str}' for {filename}")
        return False

    input_path = SPRITES_DIR / filename
    if not input_path.exists():
        print(f"  ⚠ {filename} not found")
        return False

    img = Image.open(input_path)

    # Check if already processed
    if not force and img.size == target_size:
        if is_bg or (img.mode == "RGBA" and img.split()[3].getextrema()[0] < 255):
            print(f"  ✓ {filename} already processed")
            return True

    print(f"  Processing {filename}: {img.size} → {target_size}" +
          (" (background)" if is_bg else ""))

    if not is_bg:
        # Remove green chroma key
        img = remove_green_bg(img)
        img = clean_edges(img)
        img = crop_to_content(img)

    # Resize
    img = resize_sprite(img, target_size, is_bg)

    img.save(input_path, "PNG", optimize=True)
    print(f"  ✓ {filename} done")
    return True


def main():
    parser = argparse.ArgumentParser(description="Process sprites")
    parser.add_argument("--id", help="Process only this sprite ID")
    parser.add_argument("--force", action="store_true", help="Reprocess all")
    args = parser.parse_args()

    with open(PROMPTS_FILE, "r") as f:
        data = json.load(f)

    sprites = data["sprites"]

    if args.id:
        sprites = [s for s in sprites if s["id"] == args.id]
        if not sprites:
            print(f"❌ Sprite ID '{args.id}' not found")
            return

    print(f"Processing {len(sprites)} sprites...\n")

    ok = sum(1 for s in sprites if process_sprite(s, args.force))
    print(f"\nProcessed {ok}/{len(sprites)} sprites")


if __name__ == "__main__":
    main()
