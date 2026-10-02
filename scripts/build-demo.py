"""Assemble README walkthrough from real VS Code captures (requires Pillow)."""

import argparse
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--captures", type=Path, required=True)
parser.add_argument("--pdf-preview", type=Path, required=True)
parser.add_argument("--font", type=Path, required=True)
parser.add_argument("--output", type=Path, default=Path("media/demo"))
args = parser.parse_args()
args.output.mkdir(parents=True, exist_ok=True)
W, H = 1280, 900
regular = ImageFont.truetype(str(args.font), 20)
small = ImageFont.truetype(str(args.font), 16)
large = ImageFont.truetype(str(args.font), 34)
accent = "#64e6af"
scenes = [
    (
        "01-start.png",
        "Start with your code",
        "Open Code Review Notes and start a review.",
        0,
        None,
        2400,
    ),
    (
        "02-form.png",
        "Create a review",
        "Keep the task and people together.",
        0,
        (700, 140, 2860, 1490),
        1500,
    ),
    (
        "03-details.png",
        "Add task details",
        "Task, assignee, reviewer — ready to save.",
        0,
        (700, 140, 2860, 1490),
        3000,
    ),
    (
        "04-selection.png",
        "Select the line to review",
        "The extension captures its location and code.",
        1,
        (0, 0, 2880, 1800),
        2400,
    ),
    (
        "06-note-empty.png",
        "Add a review note",
        "The module and line number are already filled in.",
        1,
        (700, 140, 2860, 1490),
        1600,
    ),
    (
        "07-note-filled.png",
        "Explain what needs fixing",
        "Describe the issue, choose severity and add a source.",
        1,
        (700, 140, 2860, 1490),
        4000,
    ),
    (
        "08-saved.png",
        "Keep every note in one place",
        "Review notes stay in the sidebar with your code.",
        1,
        (0, 0, 2880, 1800),
        2300,
    ),
    (
        "09-export.png",
        "Complete the review",
        "Export Markdown, PDF, or both.",
        2,
        (0, 0, 2880, 1800),
        3000,
    ),
    (
        "pdf",
        "Share a clear report",
        "Task details, severity, source links and a code snapshot.",
        2,
        None,
        5000,
    ),
]


def compose(scene):
    name, title, subtitle, step, crop, duration = scene
    canvas = Image.new("RGB", (W, H))
    draw = ImageDraw.Draw(canvas)
    for y in range(H):
        t = y / H
        draw.line(
            (0, y, W, y),
            fill=(int(12 + 8 * t), int(22 + 13 * t), int(29 + 15 * t)),
        )
    draw.rounded_rectangle((38, 29, 49, 40), 5, fill=accent)
    draw.text((61, 24), "CODE REVIEW NOTES", font=small, fill=accent)
    draw.text((38, 52), title, font=large, fill="#f2f7f5")
    draw.text((39, 99), subtitle, font=regular, fill="#a9bbb7")
    image = Image.open(
        args.pdf_preview if name == "pdf" else args.captures / name
    ).convert("RGB")
    if name == "pdf":
        # The actual exported report, with unused page margins cropped for legibility.
        image = image.crop((65, 65, 925, 830))
    elif crop:
        image = image.crop(crop)
    image.thumbnail((1204, 700), Image.Resampling.LANCZOS)
    x, y = (W - image.width) // 2, 143 + (700 - image.height) // 2
    shadow = Image.new("RGBA", (W, H))
    ImageDraw.Draw(shadow).rounded_rectangle(
        (x - 2, y + 4, x + image.width + 2, y + image.height + 8),
        14,
        fill=(0, 0, 0, 160),
    )
    canvas = Image.alpha_composite(
        canvas.convert("RGBA"), shadow.filter(ImageFilter.GaussianBlur(10))
    )
    mask = Image.new("L", image.size)
    ImageDraw.Draw(mask).rounded_rectangle(
        (0, 0, image.width - 1, image.height - 1), 10, fill=255
    )
    canvas.paste(image, (x, y), mask)
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle(
        (x - 1, y - 1, x + image.width, y + image.height),
        10,
        outline="#53625e",
        width=1,
    )
    for i, label in enumerate(["01  START", "02  ADD NOTES", "03  EXPORT"]):
        x = 38 + i * 405
        draw.rounded_rectangle(
            (x, 862, x + 375, 865), 2, fill=accent if i == step else "#30433c"
        )
        draw.text(
            (x, 874),
            label,
            font=small,
            fill=accent if i == step else "#82948d",
        )
    return canvas.convert("RGB")


stills = [compose(scene) for scene in scenes]
# A shared palette prevents colors from flickering between frames.
contact = Image.new("RGB", (320 * 3, 225 * 3))
for i, im in enumerate(stills):
    contact.paste(im.resize((320, 225)), ((i % 3) * 320, (i // 3) * 225))
palette = contact.quantize(colors=192)
frames = []
durations = []
for i, im in enumerate(stills):
    if i:
        for t in [0.25, 0.5, 0.75]:
            frames.append(
                Image.blend(stills[i - 1], im, t).quantize(
                    palette=palette, dither=Image.Dither.NONE
                )
            )
            durations.append(80)
    frames.append(im.quantize(palette=palette, dither=Image.Dither.NONE))
    durations.append(scenes[i][-1])
frames[0].save(
    args.output / "walkthrough.gif",
    save_all=True,
    append_images=frames[1:],
    duration=durations,
    loop=0,
    optimize=True,
    disposal=1,
)
stills[5].save(args.output / "preview.png", optimize=True)
print(
    f'{len(frames)} frames, {sum(durations)/1000:.2f}s, {(args.output/"walkthrough.gif").stat().st_size/1024/1024:.2f} MiB'
)
