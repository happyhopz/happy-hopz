import base64
import os

assets_path = r'c:\Users\Nitin\.gemini\antigravity\scratch\happy-hopz\client\src\assets\panda-logo.png'
output_path = r'c:\Users\Nitin\.gemini\antigravity\scratch\happy-hopz\client\public\favicon.svg'

with open(assets_path, 'rb') as f:
    b64 = base64.b64encode(f.read()).decode()

svg = f'''<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
<defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#ff66cc;stop-opacity:1" />
        <stop offset="50%" style="stop-color:#9966ff;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#66ffff;stop-opacity:1" />
    </linearGradient>
</defs>
<circle cx="256" cy="256" r="256" fill="url(#grad1)" />
<!-- Centering the logo and giving it a slight margin to ensure the circular background framing works well -->
<image href="data:image/png;base64,{b64}" x="40" y="40" width="432" height="432" />
</svg>'''

with open(output_path, 'w') as f:
    f.write(svg)

print(f"✅ Circular Favicon SVG generated at {output_path}")
