import os
import shutil
from pathlib import Path

# Need to run from project root, so repo root is cwd
kraid_dir = Path.cwd() / ".kraid"

def migrate():
    if not kraid_dir.exists():
        print(f"Kraid dir not found at {kraid_dir}")
        return

    # Map old paths to new paths
    moves = [
        ("org/project", "project"),
        ("org/task", "task"),
        ("org/note", "note"),
        ("org/custom", "note"),
        ("projects", "project"),
        ("references", "reference")
    ]

    for src_rel, dst_rel in moves:
        src = kraid_dir / src_rel
        dst = kraid_dir / dst_rel
        if not src.exists():
            continue

        dst.mkdir(parents=True, exist_ok=True)
        
        for file in src.glob("*.md"):
            dst_file = dst / file.name
            
            if dst_file.exists() and dst_file != file:
                dst_file = dst / f"{file.stem}-1.md"
                
            if str(file) != str(dst_file):
                shutil.move(str(file), str(dst_file))
                print(f"Moved {file} -> {dst_file}")
            
            # Update frontmatter
            try:
                content = dst_file.read_text(encoding="utf-8")
                content = content.replace("type: projects", "type: project")
                content = content.replace("type: references", "type: reference")
                content = content.replace("type: custom", "type: note")
                dst_file.write_text(content, encoding="utf-8")
            except Exception:
                pass

    # Clean up empty dirs
    dirs_to_clean = ["org", "projects", "references"]
    for d in dirs_to_clean:
        dp = kraid_dir / d
        if dp.exists() and not any(dp.iterdir()):
            shutil.rmtree(dp)
            print(f"Removed empty dir {dp}")
        elif dp.exists():
            print(f"Dir {dp} not empty, skipping removal")

if __name__ == "__main__":
    migrate()
