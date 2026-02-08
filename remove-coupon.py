# Remove lines 811-967 from Checkout.tsx
with open(r'c:\Users\Nitin\.gemini\antigravity\scratch\happy-hopz\client\src\pages\Checkout.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Keep lines 1-810 and 968-end
new_lines = lines[:810] + lines[967:]

with open(r'c:\Users\Nitin\.gemini\antigravity\scratch\happy-hopz\client\src\pages\Checkout.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Removed coupon section (lines 811-967)")
