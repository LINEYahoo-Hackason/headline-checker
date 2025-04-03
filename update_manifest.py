import yaml
import json

# YAML ファイルの読み込み
with open("config.yaml", "r", encoding="utf-8") as f:
    config = yaml.safe_load(f)

# manifest.json の読み込み
with open("manifest.json", "r", encoding="utf-8") as f:
    manifest = json.load(f)

# YAML の `matches` を `host_permissions` に適用
matches_list = config.get("matches", [])
manifest["host_permissions"] = matches_list

# `content_scripts` に `matches` を適用
if "content_scripts" in manifest and len(manifest["content_scripts"]) > 0:
    manifest["content_scripts"][0]["matches"] = matches_list


# 更新後の manifest.json を保存
with open("manifest.json", "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2, ensure_ascii=False)

print("✅ manifest.json が更新されました！")
