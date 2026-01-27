#!/usr/bin/env python3
"""
Sprite generator for Moonlight: Pixel Run using Google Gemini AI.

Usage:
    uv run python scripts/generate_sprites.py           # Generate all sprites
    uv run python scripts/generate_sprites.py --id player_gabriel  # Generate specific sprite
"""

import argparse
import json
import os
import sys
from pathlib import Path

from rich.console import Console
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TaskProgressColumn
from rich.table import Table

from google import genai
from google.genai import types

# Initialize Rich console
console = Console()

# Paths
PROJECT_ROOT = Path(__file__).parent.parent
PROMPTS_FILE = PROJECT_ROOT / "sprites" / "prompts.json"
OUTPUT_DIR = PROJECT_ROOT / "public" / "assets" / "sprites"


def load_prompts() -> dict:
    """Load sprite prompts from JSON file."""
    if not PROMPTS_FILE.exists():
        console.print(f"[red]Error:[/red] Prompts file not found: {PROMPTS_FILE}")
        sys.exit(1)

    with open(PROMPTS_FILE, "r") as f:
        return json.load(f)


def get_api_key() -> str:
    """Get Google API key from environment."""
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        console.print("[red]Error:[/red] GOOGLE_API_KEY environment variable not set")
        console.print("\nSet it with:")
        console.print("  export GOOGLE_API_KEY='your-api-key'")
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

    # Filter by ID if specified
    if args.id:
        sprites = [s for s in sprites if s["id"] == args.id]
        if not sprites:
            console.print(f"[red]Error:[/red] Sprite with ID '{args.id}' not found")
            console.print("\nAvailable IDs:")
            for s in data["sprites"]:
                console.print(f"  - {s['id']}")
            sys.exit(1)

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
            progress.update(task, description=f"[cyan]Generating {sprite['id']}...")

            image_data = generate_sprite(client, sprite)

            if image_data:
                output_path = save_sprite(image_data, sprite["filename"])
                console.print(f"  [green]Saved:[/green] {output_path}")
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
