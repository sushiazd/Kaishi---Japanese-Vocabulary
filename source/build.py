"""Assemble ../index.html from the sources. Usage: python3 source/build.py (from anywhere)."""
import json, os
here = os.path.dirname(os.path.abspath(__file__))
rd = lambda *p: open(os.path.join(here, *p), encoding='utf-8').read()
js = ''.join(rd('src', f) for f in ('app_head.js', 'views.js', 'kanji.js', 'app_tail.js'))
deck, kanji = rd('data', 'kaishi-data.json'), rd('data', 'kanji-data.json')
json.loads(deck); json.loads(kanji)
out = (rd('src', 'shell.html').replace('__CSS__', rd('src', 'style.css')).replace('__JS__', js)
       .replace('__DECK__', deck.replace('</', '<\\/')).replace('__KANJI__', kanji.replace('</', '<\\/')))
open(os.path.join(here, '..', 'index.html'), 'w', encoding='utf-8').write(out)
print(len(out.encode()), 'bytes written')
