"""Print the dominant colors of a screenshot as Refero-style 0xRRGGBB values.

Usage: python sample_colors.py <image> [count]

Near-identical shades (anti-aliasing) are merged, so the top results are
real surface/text colors rather than edge pixels.
"""
import sys
from collections import Counter

from PIL import Image


def main():
    path = sys.argv[1]
    count = int(sys.argv[2]) if len(sys.argv) > 2 else 12
    im = Image.open(path).convert("RGB")
    print(f"size: {im.width}x{im.height}")

    # Quantize to 5-bit-per-channel buckets to merge anti-aliased shades,
    # but report the most common exact color inside each bucket.
    buckets = {}
    data = im.get_flattened_data() if hasattr(im, "get_flattened_data") else im.getdata()
    for rgb, n in Counter(data).items():
        key = tuple(c >> 3 for c in rgb)
        best = buckets.get(key)
        total = (best[2] if best else 0) + n
        if not best or n > best[1]:
            buckets[key] = (rgb, n, total)
        else:
            buckets[key] = (best[0], best[1], total)

    pixels = im.width * im.height
    ranked = sorted(buckets.values(), key=lambda b: b[2], reverse=True)[:count]
    for rgb, _, total in ranked:
        print(f"0x{rgb[0]:02X}{rgb[1]:02X}{rgb[2]:02X}  {total / pixels:6.2%}")


if __name__ == "__main__":
    main()
