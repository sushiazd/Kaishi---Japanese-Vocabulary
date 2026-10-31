"""Sens français et lectures de chaque kanji présent dans les mots de Kaishi -> source/data/kanji-vocab.json.
Affichés sur les cartes de vocabulaire (« Les kanji du mot »).

Source : KANJIDIC2 (EDRDG, CC BY-SA 4.0), http://www.edrdg.org/kanjidic/kanjidic2.xml.gz
Usage : python source/kanji-tools/kanji_vocab.py chemin/vers/kanjidic2.xml.gz
Format : {kanji: [sens, on, kun]} ; sens = 3 premiers sens FR séparés par « ; » (espace avant, comme les fiches N5), lectures séparées par « ・ ».
"""
import gzip, json, os, re, sys
import xml.etree.ElementTree as ET

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, '..', 'data')

# KANJIDIC2 n'a pas de sens français pour ces kanji
FR = {
    '挨': 'pousser (dans 挨拶, salutation)', '拶': 'approcher (dans 挨拶, salutation)', '闇': 'obscurité', '椅': 'chaise',
    '溢': 'déborder', '嘘': 'mensonge', '噂': 'rumeur', '俺': 'moi (masculin, familier)', '嬉': 'joyeux',
    '隙': 'interstice ; occasion', '捲': 'enrouler ; retrousser', '鍵': 'clé', '喉': 'gorge', '呪': 'malédiction',
    '凄': 'terrible ; incroyable', '揃': 'être au complet ; aligner', '叩': 'frapper', '掴': 'saisir', '潰': 'écraser',
    '諦': 'renoncer', '謎': 'énigme', '濡': 'mouillé', '膝': 'genou', '撫': 'caresser', '頬': 'joue',
    '璧': 'joyau (dans 完璧, parfait)', '綺': 'motif brillant (dans 綺麗, beau)', '舐': 'lécher', '頷': 'hocher la tête',
}


def main():
    cards = json.load(open(os.path.join(DATA, 'kaishi-data.json'), encoding='utf-8'))['cards']
    need = {ch for c in cards for ch in c[0] if '一' <= ch <= '鿿'}
    out = {}
    for _, el in ET.iterparse(gzip.open(sys.argv[1])):
        if el.tag != 'character':
            continue
        k = el.findtext('literal')
        if k in need:
            fr = [m.text for m in el.iter('meaning') if m.get('m_lang') == 'fr']
            # まな.ぶ -> まな(ぶ), comme dans les fiches N5 ; les préfixes/suffixes (-) sont retirés
            rd = lambda t: '・'.join([re.sub(r'\.(.+)$', lambda m: '(' + m.group(1) + ')', r.text.strip('-'))
                                     for r in el.iter('reading') if r.get('r_type') == t][:3])
            out[k] = [' ; '.join(fr[:3]) if fr else FR[k], rd('ja_on'), rd('ja_kun')]
        el.clear()
    missing = need - set(out)
    if missing:
        sys.exit('Absents de KANJIDIC2 : ' + ''.join(sorted(missing)))
    json.dump(dict(sorted(out.items())), open(os.path.join(DATA, 'kanji-vocab.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, separators=(',', ':'))
    print(len(out), 'kanji écrits dans source/data/kanji-vocab.json')


if __name__ == '__main__':
    main()
