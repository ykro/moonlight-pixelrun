#!/usr/bin/env python3
"""
Sprite generator for Moonlight: Pixel Run using Google Gemini AI.

Usage:
    uv run python scripts/generate_sprites.py --players      # Generate player sprites
    uv run python scripts/generate_sprites.py --obstacles    # Generate obstacle sprites
    uv run python scripts/generate_sprites.py --collectibles # Generate collectible sprites
    uv run python scripts/generate_sprites.py --id player_gabriel_front  # Specific sprite

Setup:
    cp scripts/.env.example scripts/.env
    # Edit scripts/.env with your GOOGLE_API_KEY
"""

import argparse
import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from PIL import Image
from rich.console import Console
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TaskProgressColumn
from rich.table import Table

from google import genai
from google.genai import types

# Display sizes (4x-8x of logical size for crisp rendering)
DISPLAY_SIZES = {
    "16x24": (128, 192),
    "20x12": (160, 96),
    "20x24": (160, 192),
    "24x24": (192, 192),
    "28x20": (224, 160),
    "64x80": (256, 320),
    "16x16": (128, 128),
    "180x320": (360, 640),
}

BG_IDS = {"bg_menu", "bg_character_select", "bg_level_select", "bg_las_americas", "bg_hill_reps", "bg_fondo_vh", "bg_game_over"}

# Initialize Rich console
console = Console()

# Paths
SCRIPTS_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPTS_DIR.parent
PROMPTS_FILE = SCRIPTS_DIR / "prompts.json"
OUTPUT_DIR = PROJECT_ROOT / "public" / "assets" / "sprites"


def load_prompts() -> dict:
    """Load sprite prompts from JSON file."""
    if not PROMPTS_FILE.exists():
        console.print(f"[red]Error:[/red] Prompts file not found: {PROMPTS_FILE}")
        sys.exit(1)

    with open(PROMPTS_FILE, "r") as f:
        return json.load(f)


def get_api_key() -> str:
    """Get Google API key from .env file in scripts directory."""
    scripts_dir = Path(__file__).parent
    env_path = scripts_dir / ".env"

    if env_path.exists():
        load_dotenv(env_path)
    else:
        console.print("[red]Error:[/red] .env file not found")
        console.print(f"\n[yellow]Create it at:[/yellow] {scripts_dir}/.env")
        console.print("  [cyan]cp scripts/.env.example scripts/.env[/cyan]")
        sys.exit(1)

    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key or api_key == "your-api-key-here":
        console.print("[red]Error:[/red] GOOGLE_API_KEY not configured in scripts/.env")
        sys.exit(1)
    return api_key


def create_client(api_key: str) -> genai.Client:
    """Create Google GenAI client."""
    return genai.Client(api_key=api_key)


def generate_sprite(client: genai.Client, sprite: dict) -> bytes | None:
    """Generate a sprite image using Gemini."""
    prompt = sprite["prompt"]
    size = sprite["size"]

    # Add size context to prompt
    full_prompt = f"Generate a {size} pixel art image. {prompt}"

    try:
        response = client.models.generate_content(
            model="gemini-3-pro-image-preview",
            contents=full_prompt,
            config=types.GenerateContentConfig(
                response_modalities=["image", "text"],
            ),
        )

        # Extract image from response
        for part in response.candidates[0].content.parts:
            if part.inline_data is not None:
                return part.inline_data.data

        console.print(f"[yellow]Warning:[/yellow] No image generated for {sprite['id']}")
        return None

    except Exception as e:
        console.print(f"[red]Error generating {sprite['id']}:[/red] {str(e)}")
        return None


def save_sprite(image_data: bytes, filename: str) -> Path:
    """Save sprite image to output directory."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = OUTPUT_DIR / filename

    with open(output_path, "wb") as f:
        f.write(image_data)

    return output_path


def remove_green_bg(img: Image.Image) -> Image.Image:
    """Remove bright green (#00FF00) chroma key background."""
    img = img.convert("RGBA")
    pixels = img.load()
    width, height = img.size
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if g > 150 and r < (g - 30) and b < (g - 30):
                pixels[x, y] = (0, 0, 0, 0)
            elif abs(r) < 80 and abs(g - 255) < 80 and abs(b) < 80:
                pixels[x, y] = (0, 0, 0, 0)
    return img


def process_sprite_image(filepath: Path, target_size: tuple, sprite_id: str = "") -> None:
    """Remove background and resize sprite."""
    is_bg = sprite_id in BG_IDS
    img = Image.open(filepath)

    if not is_bg:
        img = remove_green_bg(img)
        # Crop to content
        bbox = img.getbbox()
        if bbox:
            img = img.crop((max(0, bbox[0]-2), max(0, bbox[1]-2),
                           min(img.width, bbox[2]+2), min(img.height, bbox[3]+2)))

    if is_bg:
        img = img.resize(target_size, Image.Resampling.LANCZOS)
    else:
        # Resize maintaining aspect ratio, center on transparent canvas
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
        img = result

    img.save(filepath, "PNG", optimize=True)


def display_sprites_table(sprites: list[dict]):
    """Display a table of sprites to be generated."""
    table = Table(title="Sprites to Generate")
    table.add_column("ID", style="cyan")
    table.add_column("Filename", style="green")
    table.add_column("Size", style="yellow")

    for sprite in sprites:
        table.add_row(sprite["id"], sprite["filename"], sprite["size"])

    console.print(table)
    console.print()


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Generate pixel art sprites for Moonlight: Pixel Run"
    )
    parser.add_argument(
        "--id",
        type=str,
        help="Generate only a specific sprite by ID",
    )
    parser.add_argument(
        "--players",
        action="store_true",
        help="Generate only player sprites",
    )
    parser.add_argument(
        "--obstacles",
        action="store_true",
        help="Generate only obstacle sprites",
    )
    parser.add_argument(
        "--collectibles",
        action="store_true",
        help="Generate only collectible sprites",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Regenerate sprites even if they already exist",
    )
    args = parser.parse_args()

    # Display header
    console.print(Panel.fit(
        "[bold blue]Moonlight: Pixel Run[/bold blue]\n"
        "[dim]Sprite Generator[/dim]",
        border_style="blue"
    ))
    console.print()

    # Load prompts
    console.print("[bold]Loading sprite prompts...[/bold]")
    data = load_prompts()
    sprites = data["sprites"]

    # Filter sprites based on flags
    if args.id:
        sprites = [s for s in sprites if s["id"] == args.id]
        if not sprites:
            console.print(f"[red]Error:[/red] Sprite with ID '{args.id}' not found")
            console.print("\nAvailable IDs:")
            for s in data["sprites"]:
                console.print(f"  - {s['id']}")
            sys.exit(1)
    elif args.players:
        sprites = [s for s in sprites if s["id"].startswith("player_")]
    elif args.obstacles:
        sprites = [s for s in sprites if s["id"].startswith("obstacle_")]
    elif args.collectibles:
        sprites = [s for s in sprites if s["id"].startswith("collectible_")]
    # Sin bandera = genera todo

    # Display sprites to generate
    display_sprites_table(sprites)

    # Get API key and create client
    console.print("[bold]Initializing Google GenAI client...[/bold]")
    api_key = get_api_key()
    client = create_client(api_key)
    console.print("[green]Client initialized successfully[/green]\n")

    # Generate sprites
    success_count = 0
    failed_sprites = []

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TaskProgressColumn(),
        console=console,
    ) as progress:
        task = progress.add_task("[cyan]Generating sprites...", total=len(sprites))

        for sprite in sprites:
            output_path = OUTPUT_DIR / sprite["filename"]

            # Skip if already exists and --force not set
            if output_path.exists() and not args.force:
                console.print(f"  [yellow]Skipped:[/yellow] {sprite['id']} (already exists)")
                progress.advance(task)
                continue

            progress.update(task, description=f"[cyan]Generating {sprite['id']}...")

            image_data = generate_sprite(client, sprite)

            if image_data:
                saved_path = save_sprite(image_data, sprite["filename"])
                # Process sprite: remove background and resize
                target_size = DISPLAY_SIZES.get(sprite["size"])
                if target_size:
                    process_sprite_image(saved_path, target_size, sprite["id"])
                    console.print(f"  [green]Saved & processed:[/green] {saved_path}")
                else:
                    console.print(f"  [green]Saved:[/green] {saved_path}")
                success_count += 1
            else:
                failed_sprites.append(sprite["id"])

            progress.advance(task)

    # Summary
    console.print()
    console.print(Panel.fit(
        f"[bold]Generation Complete[/bold]\n\n"
        f"[green]Successful:[/green] {success_count}/{len(sprites)}\n"
        f"[red]Failed:[/red] {len(failed_sprites)}",
        border_style="green" if not failed_sprites else "yellow"
    ))

    if failed_sprites:
        console.print("\n[yellow]Failed sprites:[/yellow]")
        for sprite_id in failed_sprites:
            console.print(f"  - {sprite_id}")

    console.print(f"\n[dim]Output directory: {OUTPUT_DIR}[/dim]")


if __name__ == "__main__":
    main()
