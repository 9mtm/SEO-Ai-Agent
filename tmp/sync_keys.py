import json
import os

locales_dir = 'locales'
en_path = os.path.join(locales_dir, 'en', 'common.json')

with open(en_path, 'r', encoding='utf-8') as f:
    en_data = json.load(f)

def sync_keys(source, target):
    """Recursively sync keys from source to target without overwriting existing target values."""
    for key, value in source.items():
        if key not in target:
            # If key is missing, add it with source value (will need translation)
            target[key] = value
        elif isinstance(value, dict) and isinstance(target[key], dict):
            # If both are dicts, recurse
            sync_keys(value, target[key])
    return target

# List of all locales to sync
target_locales = [d for d in os.listdir(locales_dir) if os.path.isdir(os.path.join(locales_dir, d)) and d != 'en']

for locale in target_locales:
    path = os.path.join(locales_dir, locale, 'common.json')
    if not os.path.exists(path):
        continue
        
    with open(path, 'r', encoding='utf-8') as f:
        try:
            target_data = json.load(f)
        except json.JSONDecodeError:
            print(f"Error decoding {path}")
            continue

    # Clean duplicates in target_data if any (JSON load already handles this by taking last key)
    updated_data = sync_keys(en_data, target_data)
    
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(updated_data, f, ensure_ascii=False, indent=2)
    
    print(f"Synced {locale}/common.json")
