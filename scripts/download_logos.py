import requests, os

logo_dir = "D:/WebDev/thinkflow.ro/public/images/logos/"
os.makedirs(logo_dir, exist_ok=True)

logos = {
    "vultr": "https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/vultr.svg",
    "hetzner": "https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/hetzner.svg",
    "digitalocean": "https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/digitalocean.svg",
    "cloudflare": "https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/cloudflare.svg",
    "vercel": "https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/vercel.svg",
    "supabase": "https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/supabase.svg",
    "elevenlabs": "https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/elevenlabs.svg",
    "sentry": "https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/sentry.svg",
    "aws": "https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg",
    "chroma": "https://www.trychroma.com/logo.svg",
    "zilliz": "https://zilliz.com/favicon.svg",
    "datadog": "https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/datadog.svg",
}

for name, url in logos.items():
    r = requests.get(url, timeout=10, headers={"User-Agent": "Mozilla/5.0"})
    if r.status_code == 200 and len(r.text) > 50:
        path = os.path.join(logo_dir, f"{name}.svg")
        with open(path, "w", encoding="utf-8") as f:
            f.write(r.text)
        print(f"  {name}: OK ({len(r.text)} bytes)")
    else:
        print(f"  {name}: FAILED ({r.status_code})")

# Pinecone and Weaviate — create minimal SVGs
print("\nCreating minimal SVGs for Pinecone and Weaviate...")

pinecone_svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 24"><rect width="100" height="24" rx="4" fill="#005B4F"/><text x="50" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold" font-family="Arial">PINECONE</text></svg>'
with open(os.path.join(logo_dir, "pinecone.svg"), "w") as f:
    f.write(pinecone_svg)
print("  pinecone: minimal SVG created")

weaviate_svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 24"><rect width="120" height="24" rx="4" fill="#4C51BF"/><text x="60" y="16" text-anchor="middle" fill="white" font-size="11" font-weight="bold" font-family="Arial">WEAVIATE</text></svg>'
with open(os.path.join(logo_dir, "weaviate.svg"), "w") as f:
    f.write(weaviate_svg)
print("  weaviate: minimal SVG created")

print("\nDone!")
