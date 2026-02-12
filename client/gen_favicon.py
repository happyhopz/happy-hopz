import base64
import os

assets_path = r'c:\Users\Nitin\.gemini\antigravity\scratch\happy-hopz\client\src\assets\panda-logo.png'
output_path = r'c:\Users\Nitin\.gemini\antigravity\scratch\happy-hopz\client\public\favicon.svg'

with open(assets_path, 'rb') as f:
    b64 = base64.b64encode(f.read()).decode()

svg = f'''<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
<defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#ff66cc;stop-opacity:1" />
        <stop offset="50%" style="stop-color:#9966ff;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#66ffff;stop-opacity:1" />
    </linearGradient>
</defs>
<rect width="512" height="512" rx="100" fill="url(#grad1)" />
<image href="data:image/png;base64,{b64}" x="51" y="51" width="410" height="410" />
</svg>'''

with open(output_path, 'w') as f:
    f.write(svg)

print(f"✅ Favicon SVG generated at {output_path}")
