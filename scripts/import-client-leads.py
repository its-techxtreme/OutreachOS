"""
Import Client Contact database Excel sheets into OutreachOS leads table.
Deletes test/fake leads first, then upserts real contacts by maps_url.
"""
from __future__ import annotations

import json
import os
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "Client Outreach Data" / "Client Contact database"
ENV_PATH = ROOT / ".env.local"


def load_env() -> dict[str, str]:
    env: dict[str, str] = {}
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key.strip()] = value.strip()
    return env


def maps_search_url(name: str, address: str | None, country: str | None) -> str:
    parts = [p for p in [name, address or "", country or ""] if p]
    query = " ".join(parts)
    return (
        "https://www.google.com/maps/search/?api=1&query="
        + urllib.parse.quote(query)
    )


def clean_phone(value) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text or text.upper() in {"NULL", "N/A", "NA", "NONE"}:
        return None
    # Indian 10-digit mobiles without country code
    digits = re.sub(r"\D", "", text)
    if len(digits) == 10 and digits[0] in "6789":
        return f"+91 {digits}"
    return text


def clean_text(value) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text if text else None


def infer_niche_dataset2(name: str) -> str:
    lower = name.lower()
    if any(k in lower for k in ("interior", "design", "decor")):
        return "Interior Design"
    if "renov" in lower:
        return "Renovation"
    if "upholster" in lower:
        return "Upholstery"
    return "Home Services"


def row_dict(headers, row) -> dict:
    return {
        (headers[i] if i < len(headers) else f"col{i}"): row[i] if i < len(row) else None
        for i in range(len(headers))
    }


def load_sheet(path: Path) -> list[dict]:
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ws = wb.active
    rows = list(ws.iter_rows(values_only=True))
    wb.close()
    if not rows:
        return []
    headers = [str(h).strip() if h is not None else f"col{i}" for i, h in enumerate(rows[0])]
    return [row_dict(headers, r) for r in rows[1:] if any(c is not None and str(c).strip() for c in r)]


def normalize_lead(source: str, raw: dict) -> dict | None:
    name = clean_text(
        raw.get("Business Name") or raw.get("business name") or raw.get("Name")
    )
    if not name:
        return None

    niche = clean_text(raw.get("Niche") or raw.get("niche"))
    country = clean_text(raw.get("Country") or raw.get("country"))
    address = clean_text(raw.get("Address") or raw.get("address"))
    phone = clean_phone(
        raw.get("Phone Number")
        or raw.get("Primary Mobile")
        or raw.get("Mobile No. (verified)")
        or raw.get("phone")
    )
    maps_url = clean_text(
        raw.get("Google maps link")
        or raw.get("Google Maps Link")
        or raw.get("maps_url")
        or raw.get("Source URL")
    )

    if source.startswith("dataset 2"):
        niche = niche or infer_niche_dataset2(name)
        country = country or "Australia"
    elif source.startswith("Dataset 1"):
        country = country or "Australia"
    elif "india" in source.lower():
        country = country or "India"
        # Prefer synthesizing maps from name/address when Source URL is social (not maps)
        social = maps_url and not (
            "google.com/maps" in maps_url or "maps.google" in maps_url
        )
        if social or not maps_url:
            maps_url = maps_search_url(name, address, country)

    niche = niche or "General"
    country = country or "Unknown"

    if not maps_url:
        maps_url = maps_search_url(name, address, country)

    # Final Status filter for verified India sheet
    final_status = clean_text(raw.get("Final Status"))
    if final_status and final_status.upper() not in {"USE", "YES", "Y"}:
        # Still import USE-only when column present; skip REJECT/etc
        if final_status.upper() in {"REJECT", "SKIP", "NO", "EXCLUDE"}:
            return None

    return {
        "name": name[:500],
        "niche": niche[:200],
        "country": country[:100],
        "phone": phone[:50] if phone else None,
        "address": address[:1000] if address else None,
        "maps_url": maps_url[:2000],
        "status": "New",
    }


def collect_leads() -> list[dict]:
    by_maps: dict[str, dict] = {}
    files = sorted(DATA_DIR.glob("*.xlsx"))
    for path in files:
        rows = load_sheet(path)
        for raw in rows:
            lead = normalize_lead(path.name, raw)
            if not lead:
                continue
            # Prefer earlier file if duplicate maps_url; keep first occurrence
            by_maps.setdefault(lead["maps_url"], lead)
    return list(by_maps.values())


def supabase_request(
    method: str,
    url: str,
    service_key: str,
    body: object | None = None,
) -> tuple[int, str]:
    data = None if body is None else json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        },
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, resp.read().decode("utf-8")
    except urllib.error.HTTPError as err:
        return err.code, err.read().decode("utf-8")


def main() -> int:
    env = load_env()
    base = env["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
    key = env["SUPABASE_SERVICE_ROLE_KEY"]

    leads = collect_leads()
    print(f"Prepared {len(leads)} unique leads from Excel")

    # Insert in batches (table should already be cleared by operator / prior step)
    batch_size = 50
    inserted = 0
    errors = 0
    for i in range(0, len(leads), batch_size):
        batch = leads[i : i + batch_size]
        status, body = supabase_request(
            "POST",
            f"{base}/rest/v1/leads",
            key,
            batch,
        )
        if status in (200, 201):
            inserted += len(batch)
            print(f"Inserted batch {i // batch_size + 1}: {len(batch)} rows")
        else:
            errors += 1
            print(f"Batch {i // batch_size + 1} failed HTTP {status}: {body[:500]}")

    # 3) Count
    count_req = urllib.request.Request(
        f"{base}/rest/v1/leads?select=id",
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Prefer": "count=exact",
            "Range": "0-0",
        },
    )
    with urllib.request.urlopen(count_req) as resp:
        content_range = resp.headers.get("content-range", "")
    print(f"Done. inserted_batches_ok={inserted} errors={errors} content-range={content_range}")
    return 0 if errors == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
