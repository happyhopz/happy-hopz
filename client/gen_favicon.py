import base64
import os

# Use the correct path to the panda logo
assets_path = r'c:\Users\Nitin\.gemini\antigravity\scratch\happy-hopz\client\src\assets\panda-logo.png'
# Output both SVG and PNG to public directory
output_svg = r'c:\Users\Nitin\.gemini\antigravity\scratch\happy-hopz\client\public\favicon.svg'
output_png = r'c:\Users\Nitin\.gemini\antigravity\scratch\happy-hopz\client\public\favicon.png'

if not os.path.exists(assets_path):
    print(f"❌ Error: Logo not found at {assets_path}")
    exit(1)

with open(assets_path, 'rb') as f:
    b64 = base64.b64encode(f.read()).decode()

# Generate a cleaner SVG without the gradient if it doesn't match the brand perfectly, 
# or keep the gradient if that's the desired aesthetic. 
# Looking at the original script, it used a specific gradient.
svg = f'''<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
<defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#ff66cc;stop-opacity:1" />
        <stop offset="50%" style="stop-color:#9966ff;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#66ffff;stop-opacity:1" />
    </linearGradient>
</defs>
<circle cx="256" cy="256" r="256" fill="url(#grad1)" />
<image href="data:image/png;base64,{b64}" x="0" y="0" width="512" height="512" />
</svg>'''

with open(output_svg, 'w') as f:
    f.write(svg)

# For the PNG, we'll just copy the source or inform the user to use the source.
# However, the source panda-logo.png is already in assets. 
# We should ensure the public/favicon.png is actually the correct Happy Hopz logo.
# Since I can't easily convert SVG to PNG without external tools like Cairo, 
# I will just ensure the existing favicon.png in public is replaced if it was Lovable.
# Based on my investigation, public/favicon.png ALREADY looks like the Happy Hopz logo.

print(f"✅ Maximum scale Favicon SVG generated at {output_svg}")
