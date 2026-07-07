import os

logo_dir = "D:/WebDev/thinkflow.ro/public/images/logos/"
os.makedirs(logo_dir, exist_ok=True)

placeholders = {
    "pinecone": ("#005B4F", "PINECONE"),
    "weaviate": ("#4C51BF", "WEAVIATE"),
    "chroma": ("#FF6B6B", "CHROMA"),
    "linode": ("#00A95C", "LINODE"),
    "namecheap": ("#DE3C3C", "NAMECHEAP"),
    "cloudways": ("#2D3748", "CLOUDWAYS"),
    "openai": ("#74AA9C", "OPENAI"),
    "milvus": ("#00A1FF", "MILVUS"),
}

for name, (color, label) in placeholders.items():
    w = len(label) * 10 + 20
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} 24"><rect width="{w}" height="24" rx="4" fill="{color}"/><text x="{w//2}" y="16" text-anchor="middle" fill="white" font-size="11" font-weight="bold" font-family="Arial,sans-serif">{label}</text></svg>'
    path = os.path.join(logo_dir, f"{name}.svg")
    with open(path, "w") as f:
        f.write(svg)
    print(f"  {name}.svg created")

print("Done!")
