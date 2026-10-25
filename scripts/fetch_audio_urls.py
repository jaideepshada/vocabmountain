"""
Fetch real human pronunciation MP3 URLs from Wikimedia for all 1020 GRE words.
Resumes from existing audio_map.json.

Two-pass approach:
  Pass 1: Query Commons directly for File:En-us-{word}.ogg / .oga
  Pass 2: For remaining words, look up Wiktionary to get the exact filename,
          then query Commons preserving original casing.

Key bug fix: Commons queries need ORIGINAL CASE filenames. We keep a
separate dict mapping lowercase-key -> original-case-filename for lookups.
"""

import json
import urllib.request
import urllib.parse
import urllib.error
import re
import time
import os

WORDS_FILE   = '/Users/jerry/Downloads/VocabMountain/public/words.json'
OUT_FILE     = '/Users/jerry/Downloads/VocabMountain/public/audio_map.json'
HEADERS      = {'User-Agent': 'VocabMountain/1.0 (educational GRE flashcard app; github.com/jaideepshada/vocabmountain)'}
RATE_SLEEP   = 1.5   # seconds between requests – polite to Wikimedia

with open(WORDS_FILE) as f:
    deck = json.load(f)

all_words = [w['word'] for w in deck]
print(f"Total words: {len(all_words)}")

# ── Load existing progress ──────────────────────────────────────────────────
audio_map: dict[str, str] = {}
if os.path.exists(OUT_FILE):
    try:
        with open(OUT_FILE) as f:
            audio_map = json.load(f)
        print(f"Loaded {len(audio_map)} existing mappings.")
    except Exception:
        pass

def save():
    with open(OUT_FILE, 'w') as f:
        json.dump(audio_map, f, indent=2)

def http_get(url: str, retries: int = 5) -> dict:
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=20) as resp:
                return json.loads(resp.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = 5 * (attempt + 1)
                print(f"    429 rate limited, waiting {wait}s...")
                time.sleep(wait)
            else:
                raise
        except Exception as e:
            print(f"    HTTP error: {e}")
            time.sleep(2)
    return {}

def commons_mp3(raw_ogg_url: str) -> str:
    """Convert a raw commons ogg/oga/wav URL to its transcoded MP3 URL."""
    clean = raw_ogg_url.split('?')[0]
    parts = clean.split('/commons/')
    fname = clean.split('/')[-1]
    return parts[0] + '/commons/transcoded/' + parts[1] + '/' + fname + '.mp3'

def query_commons(file_titles_original_case: list) -> dict:
    """
    Query Wikimedia Commons for a batch of file titles (original case).
    Returns { lowercase_title_with_underscores: mp3_url }
    """
    if not file_titles_original_case:
        return {}
    titles_param = '|'.join(file_titles_original_case)
    url = ('https://commons.wikimedia.org/w/api.php?action=query'
           f'&titles={urllib.parse.quote(titles_param, safe="|:")}'
           '&prop=imageinfo&iiprop=url&format=json')
    results = {}
    data = http_get(url)
    for pid, p in data.get('query', {}).get('pages', {}).items():
        if 'imageinfo' in p and p['imageinfo']:
            raw_url = p['imageinfo'][0]['url']
            mp3 = commons_mp3(raw_url)
            key = p['title'].replace(' ', '_').lower()
            results[key] = mp3
    time.sleep(RATE_SLEEP)
    return results

# ── Pass 1: Direct En-us-{word}.ogg / .oga pattern ─────────────────────────
unresolved_p1 = [w for w in all_words if w.lower() not in audio_map]
print(f"\nPass 1: Checking direct En-us-{{word}}.ogg/oga for {len(unresolved_p1)} words...")

BATCH = 20
for i in range(0, len(unresolved_p1), BATCH):
    batch = unresolved_p1[i:i+BATCH]
    titles_oc = []
    word_to_titles = {}  # lowercase title key → word
    for w in batch:
        for ext in ('ogg', 'oga'):
            title = f'File:En-us-{w}.{ext}'
            title_key = title.lower().replace(' ', '_')
            titles_oc.append(title)
            word_to_titles[title_key] = w.lower()

    results = query_commons(titles_oc)
    for title_key, mp3 in results.items():
        word = word_to_titles.get(title_key)
        if word and word not in audio_map:
            audio_map[word] = mp3

    if (i // BATCH) % 5 == 0:
        save()
        print(f"  Pass 1 progress: {len(audio_map)}/{len(all_words)} resolved")

save()
print(f"Pass 1 complete: {len(audio_map)}/{len(all_words)}")

# ── Pass 2: Wiktionary → exact filename → Commons ─────────────────────────
unresolved_p2 = [w for w in all_words if w.lower() not in audio_map]
print(f"\nPass 2: Wiktionary lookup for {len(unresolved_p2)} remaining words...")

WIKT_BATCH = 20
for i in range(0, len(unresolved_p2), WIKT_BATCH):
    batch = unresolved_p2[i:i+WIKT_BATCH]
    titles_param = '|'.join(w.replace(' ', '_') for w in batch)
    url = ('https://en.wiktionary.org/w/api.php?action=query'
           f'&titles={urllib.parse.quote(titles_param, safe="|")}'
           '&prop=revisions&rvprop=content&rvslots=main&format=json')

    # dict: original-case "File:..." → word (lowercase)
    oc_file_to_word: dict[str, str] = {}

    try:
        data = http_get(url)
        for pid, p in data.get('query', {}).get('pages', {}).items():
            word_title = p.get('title', '').lower()
            revs = p.get('revisions', [])
            if revs:
                content = revs[0].get('slots', {}).get('main', {}).get('*', '')
                # grab all {{audio|en|Filename...}} occurrences
                audio_files = re.findall(r'\{\{audio\|en\|([^|}]+)', content)
                for af in audio_files:
                    # preserve original case, replace spaces with underscores
                    oc_fname = 'File:' + af.strip().replace(' ', '_')
                    oc_file_to_word[oc_fname] = word_title
    except Exception as e:
        print(f"  Wiktionary error: {e}")

    time.sleep(RATE_SLEEP)

    if not oc_file_to_word:
        continue

    # Query Commons with original-case titles
    results = query_commons(list(oc_file_to_word.keys()))

    for title_key, mp3 in results.items():
        # Rebuild original-case key for lookup
        # Commons normalises space→space, but our oc_file_to_word uses underscore.
        # Try both: key from results already uses underscore from our normalize
        matched_word = oc_file_to_word.get(
            # try to match oc_file_to_word key: File:xxx
            next(
                (k for k in oc_file_to_word
                 if k.replace(' ', '_').lower() == title_key),
                None
            )
        )
        if matched_word and matched_word not in audio_map:
            audio_map[matched_word] = mp3

    if (i // WIKT_BATCH) % 5 == 0:
        save()
        print(f"  Pass 2 progress: {len(audio_map)}/{len(all_words)} resolved")

save()

total = len(audio_map)
pct = total / len(all_words) * 100
print(f"\n✅ Done! {total}/{len(all_words)} words have real audio ({pct:.1f}%)")

still_missing = [w for w in all_words if w.lower() not in audio_map]
print(f"Still missing ({len(still_missing)}):", still_missing[:20])
