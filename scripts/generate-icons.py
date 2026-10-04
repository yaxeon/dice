"""Generate the local PNG icons using only the Python standard library."""
from pathlib import Path
import math
import struct
import zlib

ICON_DIR = Path(__file__).resolve().parents[1] / "icons"


def chunk(kind, data):
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data))


def make_icon(size, filename):
    # Supersampling keeps the circular pips smooth even in the small home-screen icon.
    rows = bytearray()
    circles = [(x, y) for x in (188, 324) for y in (178, 256, 334)]
    for y in range(size):
        rows.append(0)
        for x in range(size):
            samples = []
            for sy in (.25, .75):
                for sx in (.25, .75):
                    px, py = (x + sx) * 512 / size, (y + sy) * 512 / size
                    color = 249 if 120 <= px < 392 and 120 <= py < 392 else 0
                    if any(math.hypot(px - cx, py - cy) <= 22 for cx, cy in circles):
                        color = 17
                    samples.append(color)
            color = round(sum(samples) / len(samples))
            rows.extend((color, color, color))
    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(rows, 9)) + chunk(b"IEND", b"")
    (ICON_DIR / filename).write_bytes(png)


ICON_DIR.mkdir(exist_ok=True)
for icon_size, icon_name in ((192, "icon-192.png"), (512, "icon-512.png"), (512, "maskable-512.png"), (180, "apple-touch-icon.png")):
    make_icon(icon_size, icon_name)
