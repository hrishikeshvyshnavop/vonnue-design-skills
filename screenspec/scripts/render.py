"""Screenshot a local HTML file with a headless Chromium browser (Edge or Chrome).

Usage: python render.py <html file> <output png> [width] [height]

Works on Windows, macOS and Linux. Set BROWSER=<path> to use a specific binary.
"""
import os
import shutil
import subprocess
import sys
from pathlib import Path

CANDIDATES = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
]
ON_PATH = ["google-chrome", "chromium", "chromium-browser", "microsoft-edge", "msedge", "chrome"]


def find_browser():
    if os.environ.get("BROWSER") and Path(os.environ["BROWSER"]).exists():
        return os.environ["BROWSER"]
    for c in CANDIDATES:
        if Path(c).exists():
            return c
    for name in ON_PATH:
        found = shutil.which(name)
        if found:
            return found
    sys.exit("No Chrome/Edge/Chromium found. Install one or set BROWSER=<path>.")


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    html = Path(sys.argv[1]).resolve()
    out = Path(sys.argv[2]).resolve()
    width = sys.argv[3] if len(sys.argv) > 3 else "1440"
    height = sys.argv[4] if len(sys.argv) > 4 else "1100"
    out.parent.mkdir(parents=True, exist_ok=True)
    if out.exists():
        out.unlink()

    subprocess.run(
        [find_browser(), "--headless", "--disable-gpu", "--hide-scrollbars",
         f"--window-size={width},{height}", "--virtual-time-budget=4000",
         f"--screenshot={out}", html.as_uri()],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=120,
    )
    if not out.exists():
        sys.exit(f"Render failed: {out} was not written.")
    print(f"rendered {html.name} at {width}x{height} -> {out}")


if __name__ == "__main__":
    main()
