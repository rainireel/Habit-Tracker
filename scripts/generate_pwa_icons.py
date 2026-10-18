import zlib
import struct
import math
import os

def create_png(width, height, draw_func):
    """Creates a PNG RGBA image buffer with a custom pixel draw function."""
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0) # Filter type 0 (None)
        for x in range(width):
            r, g, b, a = draw_func(x, y, width, height)
            raw_data.extend((r, g, b, a))

    compressed = zlib.compress(bytes(raw_data), level=9)

    def chunk(tag, data):
        c = tag + data
        crc = zlib.crc32(c) & 0xffffffff
        return struct.pack('>I', len(data)) + c + struct.pack('>I', crc)

    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    
    png = bytearray(b'\x89PNG\r\n\x1a\n')
    png.extend(chunk(b'IHDR', ihdr))
    png.extend(chunk(b'IDAT', compressed))
    png.extend(chunk(b'IEND', b''))
    return bytes(png)

def draw_habit_icon(x, y, w, h, is_maskable=False):
    # Normalized coordinates 0.0 to 1.0
    nx = x / float(w)
    ny = y / float(h)
    
    # Scale if maskable to preserve 15% safe zone
    scale = 0.72 if is_maskable else 0.90
    cx = (nx - 0.5) / scale + 0.5
    cy = (ny - 0.5) / scale + 0.5

    # Base background: #111315
    bg_r, bg_g, bg_b = 0x11, 0x13, 0x15

    if is_maskable:
        # Full-bleed solid background
        base_color = (bg_r, bg_g, bg_b, 255)
    else:
        # Transparent outside rounded rect
        rx = 0.22
        # Distance to rounded rect (approx)
        dx = max(0, abs(nx - 0.5) - (0.5 - rx))
        dy = max(0, abs(ny - 0.5) - (0.5 - rx))
        dist = math.sqrt(dx * dx + dy * dy)
        if dist > rx:
            return (0, 0, 0, 0)
        base_color = (bg_r, bg_g, bg_b, 255)

    if not (0.0 <= cx <= 1.0 and 0.0 <= cy <= 1.0):
        return base_color

    # Draw inner card (0.15 to 0.85)
    if 0.18 <= cx <= 0.82 and 0.18 <= cy <= 0.82:
        # Header bar (0.18 to 0.32)
        if cy <= 0.32:
            # Header color #1f232b
            hr, hg, hb = 0x1f, 0x23, 0x2b
            # Dots: red, yellow, green
            if 0.23 <= cy <= 0.27:
                if abs(cx - 0.28) < 0.025: return (0xef, 0x44, 0x44, 255)
                if abs(cx - 0.35) < 0.025: return (0xf5, 0x9e, 0x0b, 255)
                if abs(cx - 0.42) < 0.025: return (0x10, 0xb9, 0x81, 255)
            return (hr, hg, hb, 255)
        
        # Grid area
        # Grid lines:
        is_grid_line = False
        if abs(cx - 0.40) < 0.008 or abs(cx - 0.60) < 0.008: is_grid_line = True
        if abs(cy - 0.45) < 0.008 or abs(cy - 0.58) < 0.008 or abs(cy - 0.71) < 0.008: is_grid_line = True
        
        if is_grid_line:
            return (0x2a, 0x2e, 0x37, 255)
            
        # Draw some checks in cells
        # Cell 1: cx~0.50, cy~0.38
        # Cell 2: cx~0.70, cy~0.38
        # Cell 3: cx~0.50, cy~0.51
        for (chk_x, chk_y) in [(0.50, 0.38), (0.70, 0.38), (0.50, 0.51)]:
            d_chk = math.sqrt((cx - chk_x)**2 + (cy - chk_y)**2)
            if d_chk < 0.035:
                return (0x10, 0xb9, 0x81, 255) # Emerald circle

    # Large Badge Checkmark in bottom right (center ~ 0.70, 0.70)
    badge_x, badge_y = 0.68, 0.68
    badge_dist = math.sqrt((cx - badge_x)**2 + (cy - badge_y)**2)
    if badge_dist < 0.18:
        if badge_dist > 0.15:
            return (0x11, 0x13, 0x15, 255) # Dark border ring
        # Emerald gradient fill
        return (0x10, 0xb9, 0x81, 255)
    
    # Checkmark white lines inside badge:
    if 0.54 <= cx <= 0.82 and 0.54 <= cy <= 0.82:
        # Checkmark path points: (0.60, 0.68) -> (0.66, 0.74) -> (0.76, 0.62)
        # Segment 1: from (0.60, 0.68) to (0.66, 0.74)
        t1 = (cx - 0.60) / 0.06
        if 0.0 <= t1 <= 1.0:
            target_y = 0.68 + t1 * 0.06
            if abs(cy - target_y) < 0.022:
                return (255, 255, 255, 255)
        # Segment 2: from (0.66, 0.74) to (0.76, 0.62)
        t2 = (cx - 0.66) / 0.10
        if 0.0 <= t2 <= 1.0:
            target_y = 0.74 - t2 * 0.12
            if abs(cy - target_y) < 0.022:
                return (255, 255, 255, 255)

    return base_color

os.makedirs('public', exist_ok=True)

# Generate 192x192
with open('public/pwa-192x192.png', 'wb') as f:
    f.write(create_png(192, 192, lambda x, y, w, h: draw_habit_icon(x, y, w, h, False)))

# Generate 512x512
with open('public/pwa-512x512.png', 'wb') as f:
    f.write(create_png(512, 512, lambda x, y, w, h: draw_habit_icon(x, y, w, h, False)))

# Generate maskable 512x512 (with 15% safe zone padding)
with open('public/pwa-maskable-512x512.png', 'wb') as f:
    f.write(create_png(512, 512, lambda x, y, w, h: draw_habit_icon(x, y, w, h, True)))

# Generate 180x180 for Apple touch icon
with open('public/apple-touch-icon.png', 'wb') as f:
    f.write(create_png(180, 180, lambda x, y, w, h: draw_habit_icon(x, y, w, h, False)))

# Generate 48x48 for favicon
with open('public/favicon.ico', 'wb') as f:
    f.write(create_png(48, 48, lambda x, y, w, h: draw_habit_icon(x, y, w, h, False)))

print("PWA PNG icons generated successfully!")
