"""Generate practice-tasks.js for AI-Assisted Software Engineering.

The code libraries (html, css, js, testing, python) are authored inline below.
The judgment libraries (specs, git, review, detective, integrated) live in
_aise_judgment_tasks.py: they used to be multiple choice, and recognising the
right answer in a list of three is a different, much weaker skill than
producing the artefact, so they now grade real work.
"""
import os
import sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _aise_judgment_tasks import (
    SPEC_TASKS, GIT_TASKS, REVIEW_TASKS, DETECTIVE_TASKS, INTEGRATED_TASKS,
)

OUT = Path(r"d:\zenith-studio\courses\ai-assisted-software-engineering\practice-tasks.js")

def obj(d: dict) -> str:
    parts = []
    for k, v in d.items():
        if k in ("checks", "testCases", "options", "goodImpl", "badImpl") and isinstance(v, str):
            parts.append(f"{k}: {v}")
        elif isinstance(v, bool):
            parts.append(f"{k}: {'true' if v else 'false'}")
        elif isinstance(v, (int, float)):
            parts.append(f"{k}: {v}")
        elif v is None:
            continue
        else:
            s = str(v).replace("\\", "\\\\").replace("`", "\\`")
            parts.append(f"{k}: {js_str(v)}" if not (isinstance(v, str) and v.startswith("[")) else f"{k}: {v}")
    return "{ " + ", ".join(parts) + " }"

def js_str(v) -> str:
    return json_dumps(v)

import json
def json_dumps(v):
    return json.dumps(v, ensure_ascii=False)

tasks = []

# ---- HTML 20 ----
html_items = [
    ("html-f01", "html-structure", "guided", "A single heading",
     "Write a page whose only heading is an <h1> with the exact text Welcome.",
     "<!DOCTYPE html><html><body></body></html>",
     "[{ name: 'has h1', hint: 'Add an h1.', test: d => !!d.querySelector('h1') }, { name: 'text is Welcome', hint: 'The h1 text must be exactly Welcome.', test: d => (d.querySelector('h1')||{}).textContent.trim() === 'Welcome' }]"),
    ("html-f02", "html-structure", "guided", "Paragraph under the heading",
     "Add an h1 'Clinic hours' and a <p> that contains the word Saturday.",
     "<!DOCTYPE html><html><body></body></html>",
     "[{ name: 'h1', test: d => (d.querySelector('h1')||{}).textContent.includes('Clinic hours'), hint: 'h1 must include Clinic hours' }, { name: 'paragraph mentions Saturday', test: d => (d.querySelector('p')||{}).textContent.includes('Saturday'), hint: 'Need a p that mentions Saturday' }]"),
    ("html-f03", "html-structure", "guided", "Unordered list of three items",
     "Make a <ul> with exactly three <li> elements.",
     "<!DOCTYPE html><html><body></body></html>",
     "[{ name: 'ul exists', test: d => !!d.querySelector('ul'), hint: 'Use ul, not ol' }, { name: 'three li', test: d => d.querySelectorAll('ul li').length === 3, hint: 'Exactly three li inside the ul' }]"),
    ("html-f04", "html-links", "guided", "A real link",
     "Add an <a> whose href is https://example.com and whose text is Docs.",
     "<!DOCTYPE html><html><body></body></html>",
     "[{ name: 'anchor', test: d => !!d.querySelector('a'), hint: 'Need an a tag' }, { name: 'href', test: d => (d.querySelector('a')||{}).getAttribute('href') === 'https://example.com', hint: 'href must be https://example.com' }, { name: 'text', test: d => (d.querySelector('a')||{}).textContent.trim() === 'Docs', hint: 'Link text must be Docs' }]"),
    ("html-f05", "html-forms", "guided", "Labeled email field",
     "A form with a label for='email' and an input id='email' type='email'.",
     "<!DOCTYPE html><html><body></body></html>",
     "[{ name: 'input email', test: d => { const i=d.querySelector('#email'); return i && i.getAttribute('type')==='email'; }, hint: 'id=email type=email' }, { name: 'label for', test: d => { const l=d.querySelector('label[for=email]'); return !!l; }, hint: 'label for=email' }]"),
    ("html-f06", "html-structure", "semiguided", "Header, main, footer",
     "Use <header>, <main>, and <footer> once each. Put an h1 inside header.",
     "<!DOCTYPE html><html><body></body></html>",
     "[{ name: 'header', test: d => d.querySelectorAll('header').length===1, hint: 'One header' }, { name: 'main', test: d => d.querySelectorAll('main').length===1, hint: 'One main' }, { name: 'footer', test: d => d.querySelectorAll('footer').length===1, hint: 'One footer' }, { name: 'h1 in header', test: d => !!d.querySelector('header h1'), hint: 'h1 belongs in the header' }]"),
    ("html-f07", "html-images", "semiguided", "Image with alt",
     "Add an img with src='clinic.jpg' and a non-empty alt attribute.",
     "<!DOCTYPE html><html><body></body></html>",
     "[{ name: 'img src', test: d => (d.querySelector('img')||{}).getAttribute('src')==='clinic.jpg', hint: 'src=clinic.jpg' }, { name: 'alt present', test: d => { const a=(d.querySelector('img')||{}).getAttribute('alt'); return typeof a==='string' && a.trim().length>0; }, hint: 'alt must not be empty' }]"),
    ("html-f08", "html-forms", "semiguided", "Required name field",
     "A form with input name='fullName' that is required.",
     "<!DOCTYPE html><html><body><form></form></body></html>",
     "[{ name: 'named input', test: d => !!d.querySelector('input[name=fullName]'), hint: 'name=fullName' }, { name: 'required', test: d => d.querySelector('input[name=fullName]') && d.querySelector('input[name=fullName]').hasAttribute('required'), hint: 'Add the required attribute' }]"),
    ("html-f09", "html-tables", "semiguided", "Two-column table",
     "A table with a thead row of Day and Hours, and at least one tbody row.",
     "<!DOCTYPE html><html><body></body></html>",
     "[{ name: 'table', test: d => !!d.querySelector('table'), hint: 'Need a table' }, { name: 'thead cells', test: d => { const t=[...d.querySelectorAll('thead th, thead td')].map(x=>x.textContent.trim()); return t.includes('Day') && t.includes('Hours'); }, hint: 'thead must include Day and Hours' }, { name: 'tbody row', test: d => d.querySelectorAll('tbody tr').length>=1, hint: 'At least one tbody tr' }]"),
    ("html-f10", "html-structure", "challenge", "Skip-link",
     "First focusable thing in body is an a.href='#main'. A main#main exists.",
     "<!DOCTYPE html><html><body></body></html>",
     "[{ name: 'skip href', test: d => { const a=d.querySelector('body a'); return a && a.getAttribute('href')==='#main'; }, hint: 'First body link should be href=#main' }, { name: 'main id', test: d => !!d.querySelector('main#main'), hint: 'Need main id=main' }]"),
    ("html-f11", "html-forms", "challenge", "Fieldset for hours",
     "A fieldset whose legend text is Hours, containing two radio inputs that share name='shift'.",
     "<!DOCTYPE html><html><body></body></html>",
     "[{ name: 'legend', test: d => (d.querySelector('fieldset legend')||{}).textContent.trim()==='Hours', hint: 'legend Hours' }, { name: 'two radios', test: d => d.querySelectorAll('fieldset input[type=radio][name=shift]').length===2, hint: 'Two radios named shift' }]"),
    ("html-f12", "html-links", "challenge", "New-tab link is safe",
     "An a[target=_blank] must also have rel that includes noopener.",
     "<!DOCTYPE html><html><body></body></html>",
     "[{ name: 'target blank', test: d => !!d.querySelector('a[target=_blank]'), hint: 'Need target=_blank' }, { name: 'noopener', test: d => { const r=(d.querySelector('a[target=_blank]')||{}).getAttribute('rel')||''; return r.split(/\\s+/).includes('noopener'); }, hint: 'rel must include noopener' }]"),
    ("html-f13", "html-structure", "guided", "Language on html",
     "The html element must have lang='en'.",
     "<html><body><p>Hi</p></body></html>",
     "[{ name: 'lang en', test: d => d.documentElement.getAttribute('lang')==='en', hint: 'Set html lang=en' }]"),
    ("html-f14", "html-structure", "semiguided", "One h1 only",
     "Exactly one h1. You may use h2 after it.",
     "<!DOCTYPE html><html><body><h1>A</h1><h1>B</h1></body></html>",
     "[{ name: 'exactly one h1', test: d => d.querySelectorAll('h1').length===1, hint: 'Remove the extra h1' }]"),
    ("html-f15", "html-forms", "guided", "Button submits",
     "A form with a button type='submit' whose text is Send.",
     "<!DOCTYPE html><html><body><form></form></body></html>",
     "[{ name: 'submit button', test: d => { const b=d.querySelector('form button[type=submit], form input[type=submit]'); return !!b; }, hint: 'type=submit' }, { name: 'Send', test: d => { const b=d.querySelector('form button'); return b && b.textContent.trim()==='Send'; }, hint: 'Button text Send' }]"),
    ("html-f16", "html-images", "guided", "Decorative image",
     "An img with empty alt='' (decorative) and src='line.svg'.",
     "<!DOCTYPE html><html><body></body></html>",
     "[{ name: 'src', test: d => (d.querySelector('img')||{}).getAttribute('src')==='line.svg', hint: 'src=line.svg' }, { name: 'empty alt', test: d => (d.querySelector('img')||{}).getAttribute('alt')==='', hint: 'alt must be present and empty' }]"),
    ("html-f17", "html-structure", "challenge", "Nav with two links",
     "A nav containing exactly two a tags.",
     "<!DOCTYPE html><html><body></body></html>",
     "[{ name: 'nav', test: d => !!d.querySelector('nav'), hint: 'Need nav' }, { name: 'two links', test: d => d.querySelectorAll('nav a').length===2, hint: 'Exactly two anchors in nav' }]"),
    ("html-f18", "html-tables", "challenge", "Scope on headers",
     "A table th with scope='col'.",
     "<!DOCTYPE html><html><body></body></html>",
     "[{ name: 'th scope col', test: d => !!d.querySelector('th[scope=col]'), hint: 'Add th scope=col' }]"),
    ("html-f19", "html-forms", "mastery", "Accessible search",
     "A form with role or an input type=search labeled via aria-label='Search site'.",
     "<!DOCTYPE html><html><body></body></html>",
     "[{ name: 'search input', test: d => !!d.querySelector('input[type=search]'), hint: 'type=search' }, { name: 'aria-label', test: d => (d.querySelector('input[type=search]')||{}).getAttribute('aria-label')==='Search site', hint: 'aria-label=Search site' }]"),
    ("html-f20", "html-structure", "mastery", "Article with time",
     "An article that contains a time datetime='2026-08-01' and an h2.",
     "<!DOCTYPE html><html><body></body></html>",
     "[{ name: 'article', test: d => !!d.querySelector('article'), hint: 'Need article' }, { name: 'time', test: d => (d.querySelector('article time')||{}).getAttribute('datetime')==='2026-08-01', hint: 'time datetime=2026-08-01' }, { name: 'h2', test: d => !!d.querySelector('article h2'), hint: 'h2 inside article' }]"),
]
for t in html_items:
    tasks.append({
        "id": t[0], "skill": t[1], "tool": "html", "level": t[2], "kind": "html",
        "title": t[3], "prompt": t[4], "starter": t[5], "checks": t[6],
        "prerequisite": "[]",
    })

# ---- CSS 20 ----
css_items = [
    ("css-f01", "css-selectors", "guided", "Paint the title blue",
     "Make h1 color #60a5fa.",
     "<h1 id='t'>Title</h1>",
     "h1 { }",
     "[{ name: 'h1 color', test: (root) => getComputedStyle(root.querySelector('h1')).color.replace(/\\s/g,'') === 'rgb(96,165,250)', hint: 'color: #60a5fa on h1' }]"),
    ("css-f02", "css-box", "guided", "Padding on the card",
     "Give .card padding of 24px.",
     "<div class='card'>Hi</div>",
     ".card { }",
     "[{ name: 'padding', test: (root) => getComputedStyle(root.querySelector('.card')).paddingTop === '24px', hint: 'padding: 24px' }]"),
    ("css-f03", "css-box", "guided", "Border not outline",
     "Give .card a 1px solid border. Color can be any non-transparent.",
     "<div class='card'>Hi</div>",
     ".card { }",
     "[{ name: 'border width', test: (root) => getComputedStyle(root.querySelector('.card')).borderTopWidth === '1px', hint: 'border: 1px solid ...' }]"),
    ("css-f04", "css-layout", "guided", "Flex row",
     "Make .row display flex.",
     "<div class='row'><span>a</span><span>b</span></div>",
     ".row { }",
     "[{ name: 'flex', test: (root) => getComputedStyle(root.querySelector('.row')).display === 'flex', hint: 'display: flex' }]"),
    ("css-f05", "css-layout", "semiguided", "Gap between items",
     ".row is flex with a 16px gap.",
     "<div class='row'><span>a</span><span>b</span></div>",
     ".row { }",
     "[{ name: 'flex', test: (root) => getComputedStyle(root.querySelector('.row')).display === 'flex', hint: 'display:flex' }, { name: 'gap', test: (root) => getComputedStyle(root.querySelector('.row')).gap === '16px' || getComputedStyle(root.querySelector('.row')).columnGap === '16px', hint: 'gap: 16px' }]"),
    ("css-f06", "css-typography", "guided", "Readable body",
     "p font-size 16px and line-height 1.5 (24px).",
     "<p>Hello</p>",
     "p { }",
     "[{ name: 'size', test: (root) => getComputedStyle(root.querySelector('p')).fontSize === '16px', hint: 'font-size: 16px' }, { name: 'leading', test: (root) => getComputedStyle(root.querySelector('p')).lineHeight === '24px', hint: 'line-height: 1.5' }]"),
    ("css-f07", "css-selectors", "semiguided", "Button hover is not required",
     "button.primary background #60a5fa.",
     "<button class='primary'>Go</button>",
     "button { }",
     "[{ name: 'bg', test: (root) => getComputedStyle(root.querySelector('button.primary')).backgroundColor.replace(/\\s/g,'') === 'rgb(96,165,250)', hint: 'button.primary { background: #60a5fa }' }]"),
    ("css-f08", "css-box", "semiguided", "Max width wrap",
     ".wrap max-width 720px and margin-left auto (centered).",
     "<div class='wrap'>x</div>",
     ".wrap { }",
     "[{ name: 'max-width', test: (root) => getComputedStyle(root.querySelector('.wrap')).maxWidth === '720px', hint: 'max-width: 720px' }, { name: 'ml auto', test: (root) => getComputedStyle(root.querySelector('.wrap')).marginLeft === 'auto', hint: 'margin-left: auto' }]"),
    ("css-f09", "css-layout", "challenge", "Grid two columns",
     ".grid display grid with two equal columns (1fr 1fr).",
     "<div class='grid'><div>a</div><div>b</div></div>",
     ".grid { }",
     "[{ name: 'grid', test: (root) => getComputedStyle(root.querySelector('.grid')).display === 'grid', hint: 'display:grid' }, { name: 'two cols', test: (root) => { const t=getComputedStyle(root.querySelector('.grid')).gridTemplateColumns; return t.split(' ').filter(Boolean).length===2; }, hint: 'grid-template-columns: 1fr 1fr' }]"),
    ("css-f10", "css-visibility", "guided", "Hide visually",
     ".sr-only should have position absolute and a clip or 1px size (any common sr-only pattern). Accept width 1px.",
     "<div class='sr-only'>skip</div>",
     ".sr-only { }",
     "[{ name: 'absolute or clip', test: (root) => { const s=getComputedStyle(root.querySelector('.sr-only')); return s.position==='absolute' || s.width==='1px' || s.clip !== 'auto'; }, hint: 'Use a screen-reader-only pattern: position:absolute; width:1px; overflow:hidden' }]"),
    ("css-f11", "css-box", "challenge", "Box sizing",
     "html or * uses border-box.",
     "<div class='box'>x</div>",
     "",
     "[{ name: 'border-box on box', test: (root, css) => /box-sizing\\s*:\\s*border-box/.test(css), hint: 'Write box-sizing: border-box in your CSS' }]"),
    ("css-f12", "css-typography", "semiguided", "Mono for code",
     "code uses a monospace font family (must include the word monospace).",
     "<code>x</code>",
     "code { }",
     "[{ name: 'mono', test: (root) => /mono/i.test(getComputedStyle(root.querySelector('code')).fontFamily), hint: 'font-family: ... monospace' }]"),
    ("css-f13", "css-selectors", "challenge", "Descendant only",
     "Only p inside .card should be color #9aa6c2. A p outside stays default (not that color).",
     "<div class='card'><p id='in'>in</p></div><p id='out'>out</p>",
     "",
     "[{ name: 'inside', test: (root) => getComputedStyle(root.querySelector('#in')).color.replace(/\\s/g,'')==='rgb(154,166,194)', hint: '.card p { color:#9aa6c2 }' }, { name: 'outside unchanged', test: (root) => getComputedStyle(root.querySelector('#out')).color.replace(/\\s/g,'')!=='rgb(154,166,194)', hint: 'Do not style all p' }]"),
    ("css-f14", "css-layout", "guided", "Center text",
     ".hero text-align center.",
     "<div class='hero'>Hi</div>",
     ".hero { }",
     "[{ name: 'center', test: (root) => getComputedStyle(root.querySelector('.hero')).textAlign === 'center', hint: 'text-align: center' }]"),
    ("css-f15", "css-box", "guided", "Margin below heading",
     "h2 margin-bottom 12px.",
     "<h2>Sec</h2>",
     "h2 { }",
     "[{ name: 'mb', test: (root) => getComputedStyle(root.querySelector('h2')).marginBottom === '12px', hint: 'margin-bottom: 12px' }]"),
    ("css-f16", "css-layout", "semiguided", "Space-between",
     ".bar is flex and justify-content space-between.",
     "<div class='bar'><span>L</span><span>R</span></div>",
     ".bar { }",
     "[{ name: 'flex', test: (root) => getComputedStyle(root.querySelector('.bar')).display==='flex', hint: 'display:flex' }, { name: 'between', test: (root) => getComputedStyle(root.querySelector('.bar')).justifyContent==='space-between', hint: 'justify-content: space-between' }]"),
    ("css-f17", "css-visibility", "semiguided", "Hide the extra",
     ".extra { display: none }",
     "<div class='extra'>no</div>",
     "",
     "[{ name: 'none', test: (root) => getComputedStyle(root.querySelector('.extra')).display==='none', hint: 'display: none' }]"),
    ("css-f18", "css-typography", "challenge", "Letter spacing eyebrow",
     ".eyebrow letter-spacing at least 1px and text-transform uppercase.",
     "<div class='eyebrow'>lab</div>",
     ".eyebrow { }",
     "[{ name: 'upper', test: (root) => getComputedStyle(root.querySelector('.eyebrow')).textTransform==='uppercase', hint: 'text-transform: uppercase' }, { name: 'tracking', test: (root) => parseFloat(getComputedStyle(root.querySelector('.eyebrow')).letterSpacing) >= 1, hint: 'letter-spacing: 0.1em or 2px' }]"),
    ("css-f19", "css-layout", "mastery", "Sticky header",
     ".top { position: sticky; top: 0 }",
     "<div class='top'>bar</div>",
     ".top { }",
     "[{ name: 'sticky', test: (root) => getComputedStyle(root.querySelector('.top')).position==='sticky', hint: 'position: sticky' }, { name: 'top 0', test: (root) => getComputedStyle(root.querySelector('.top')).top==='0px', hint: 'top: 0' }]"),
    ("css-f20", "css-box", "mastery", "Full-bleed section",
     ".bleed width 100% and no max-width (max-width none or 0 or empty).",
     "<div class='bleed'>x</div>",
     ".bleed { }",
     "[{ name: 'width 100%', test: (root, css) => /width\\s*:\\s*100%/.test(css), hint: 'width: 100%' }]"),
]
for t in css_items:
    tasks.append({
        "id": t[0], "skill": t[1], "tool": "css", "level": t[2], "kind": "css",
        "title": t[3], "prompt": t[4], "fixtureHtml": t[5], "starter": t[6], "checks": t[7],
        "prerequisite": "[]",
    })

# ---- JS 40 ----
js_funcs = [
    ("js-f01", "js-functions", "guided", "total_revenue", "Sum amount on a list of {amount} objects. Empty list is 0.",
     "def total_revenue",  # placeholder
     "function total_revenue(orders){\n  return 0;\n}",
     "[{ name: 'two', args: [[{amount:10},{amount:2.5}]], expected: 12.5 }, { name: 'empty', args: [[]], expected: 0 }]"),
    ("js-f02", "js-functions", "guided", "greet", "greet('Ada') returns 'Hello, Ada'.",
     None, "function greet(name){\n  return '';\n}",
     "[{ name: 'Ada', args: ['Ada'], expected: 'Hello, Ada' }, { name: 'Sam', args: ['Sam'], expected: 'Hello, Sam' }]"),
    ("js-f03", "js-functions", "guided", "is_even", "Return true if n is even.",
     None, "function is_even(n){\n  return false;\n}",
     "[{ name: '2', args: [2], expected: True }, { name: '3', args: [3], expected: False }, { name: '0', args: [0], expected: True }]"),
    ("js-f04", "js-arrays", "guided", "pluck_names", "From [{name}], return an array of names.",
     None, "function pluck_names(rows){\n  return [];\n}",
     "[{ name: 'two', args: [[{name:'A'},{name:'B'}]], expected: ['A','B'] }, { name: 'empty', args: [[]], expected: [] }]"),
    ("js-f05", "js-arrays", "guided", "count_status", "Count how many items have status === target.",
     None, "function count_status(rows, target){\n  return 0;\n}",
     "[{ name: 'open', args: [[{status:'open'},{status:'done'},{status:'open'}],'open'], expected: 2 }, { name: 'none', args: [[{status:'done'}],'open'], expected: 0 }]"),
    ("js-f06", "js-functions", "semiguided", "clamp", "clamp(n, lo, hi) keeps n in [lo, hi].",
     None, "function clamp(n, lo, hi){\n  return n;\n}",
     "[{ name: 'mid', args: [5,0,10], expected: 5 }, { name: 'low', args: [-1,0,10], expected: 0 }, { name: 'high', args: [99,0,10], expected: 10 }]"),
    ("js-f07", "js-strings", "guided", "slugify", "Lowercase, spaces to hyphens. 'Hello World' -> 'hello-world'.",
     None, "function slugify(s){\n  return s;\n}",
     "[{ name: 'basic', args: ['Hello World'], expected: 'hello-world' }, { name: 'already', args: ['ok'], expected: 'ok' }]"),
    ("js-f08", "js-strings", "semiguided", "initials", "'Ada Lovelace' -> 'AL'. Split on spaces, take first char of each word, upper.",
     None, "function initials(name){\n  return '';\n}",
     "[{ name: 'two', args: ['Ada Lovelace'], expected: 'AL' }, { name: 'one', args: ['Cher'], expected: 'C' }]"),
    ("js-f09", "js-arrays", "semiguided", "unique", "Return unique values preserving first-seen order.",
     None, "function unique(xs){\n  return xs;\n}",
     "[{ name: 'dups', args: [[1,1,2,1]], expected: [1,2] }, { name: 'none', args: [['a','b']], expected: ['a','b'] }]"),
    ("js-f10", "js-objects", "guided", "get_path", "get_path({a:{b:2}}, 'a.b') returns 2. Missing is null.",
     None, "function get_path(obj, path){\n  return null;\n}",
     "[{ name: 'nested', args: [{'a': {'b': 2}}, 'a.b'], expected: 2 }, { name: 'miss', args: [{'a': 1}, 'a.z'], expected: None }]"),
    ("js-f11", "js-functions", "semiguided", "average", "Mean of numbers. Empty list returns 0.",
     None, "function average(xs){\n  return 0;\n}",
     "[{ name: 'two', args: [[2,4]], expected: 3 }, { name: 'empty', args: [[]], expected: 0 }]"),
    ("js-f12", "js-arrays", "challenge", "group_by", "group_by([{k:'a'},{k:'b'},{k:'a'}], 'k') -> {a:[...], b:[...] } with original objects.",
     None, "function group_by(rows, key){\n  return {};\n}",
     "[{ name: 'two keys', args: [[{k:'a',n:1},{k:'b',n:2},{k:'a',n:3}],'k'], expected: {'a':[{'k':'a','n':1},{'k':'a','n':3}],'b':[{'k':'b','n':2}]} }]"),
    ("js-f13", "js-functions", "challenge", "parse_query", "parse_query('a=1&b=hi') -> {a:'1', b:'hi'}. No leading ?",
     None, "function parse_query(q){\n  return {};\n}",
     "[{ name: 'two', args: ['a=1&b=hi'], expected: {'a':'1','b':'hi'} }, { name: 'one', args: ['x=9'], expected: {'x':'9'} }]"),
    ("js-f14", "js-strings", "guided", "starts_with_http", "True if s starts with http:// or https://.",
     None, "function starts_with_http(s){\n  return false;\n}",
     "[{ name: 'https', args: ['https://x.com'], expected: True }, { name: 'ftp', args: ['ftp://x'], expected: False }, { name: 'http', args: ['http://x'], expected: True }]"),
    ("js-f15", "js-arrays", "guided", "sum_range", "Sum numbers from lo to hi inclusive.",
     None, "function sum_range(lo, hi){\n  return 0;\n}",
     "[{ name: '1-3', args: [1,3], expected: 6 }, { name: 'same', args: [4,4], expected: 4 }]"),
    ("js-f16", "js-objects", "semiguided", "pick", "pick({a:1,b:2,c:3}, ['a','c']) -> {a:1,c:3}.",
     None, "function pick(obj, keys){\n  return {};\n}",
     "[{ name: 'two', args: [{'a':1,'b':2,'c':3},['a','c']], expected: {'a':1,'c':3} }]"),
    ("js-f17", "js-functions", "challenge", "retry_ok", "retry_ok(fn, n) calls fn until it returns true or n times. Return true if any call was true.",
     None, "function retry_ok(fn, n){\n  return false;\n}",
     None),  # special - skip complex, replace
    ("js-f18", "js-arrays", "semiguided", "chunk", "chunk([1,2,3,4,5], 2) -> [[1,2],[3,4],[5]].",
     None, "function chunk(xs, n){\n  return [];\n}",
     "[{ name: '2', args: [[1,2,3,4,5],2], expected: [[1,2],[3,4],[5]] }]"),
    ("js-f19", "js-strings", "challenge", "mask_email", "mask_email('ada@site.com') -> 'a**@site.com' (first char + ** + @domain).",
     None, "function mask_email(e){\n  return e;\n}",
     "[{ name: 'ada', args: ['ada@site.com'], expected: 'a**@site.com' }]"),
    ("js-f20", "js-functions", "mastery", "deep_equal", "deep_equal on JSON-like values (no functions).",
     None, "function deep_equal(a, b){\n  return a === b;\n}",
     "[{ name: 'obj', args: [{'x':[1]}, {'x':[1]}], expected: True }, { name: 'diff', args: [{'x':1},{'x':2}], expected: False }]"),
]

# fix js-f17 with simple cases using a note - use increment instead
js_funcs[16] = (
    "js-f17", "js-functions", "challenge", "times",
    "times(n, fn) calls fn with 0..n-1 and returns the array of results.",
    None, "function times(n, fn){\n  return [];\n}",
    "[{ name: 'triple', args: [3, '(i)=>i*2'], expected: 'SPECIAL' }]",
)

# I'll implement js tasks more carefully without function args in JSON

js_clean = [
    ("js-f01","js-functions","guided","total_revenue","Sum .amount. Empty is 0.","function total_revenue(orders){\n  return 0;\n}",
     [{"name":"two","args":[[{"amount":10},{"amount":2.5}]],"expected":12.5},{"name":"empty","args":[[]],"expected":0}]),
    ("js-f02","js-functions","guided","greet","greet('Ada') is 'Hello, Ada'.","function greet(name){\n  return '';\n}",
     [{"name":"Ada","args":["Ada"],"expected":"Hello, Ada"}]),
    ("js-f03","js-functions","guided","is_even","True if n is even.","function is_even(n){\n  return false;\n}",
     [{"name":"2","args":[2],"expected":True},{"name":"3","args":[3],"expected":False}]),
    ("js-f04","js-arrays","guided","pluck_names","Map to .name.","function pluck_names(rows){\n  return [];\n}",
     [{"name":"two","args":[[{"name":"A"},{"name":"B"}]],"expected":["A","B"]}]),
    ("js-f05","js-arrays","guided","count_status","Count status === target.","function count_status(rows, target){\n  return 0;\n}",
     [{"name":"open","args":[[{"status":"open"},{"status":"done"},{"status":"open"}],"open"],"expected":2}]),
    ("js-f06","js-functions","semiguided","clamp","Keep n in [lo,hi].","function clamp(n, lo, hi){\n  return n;\n}",
     [{"name":"low","args":[-1,0,10],"expected":0},{"name":"high","args":[99,0,10],"expected":10}]),
    ("js-f07","js-strings","guided","slugify","Lowercase, spaces to -.","function slugify(s){\n  return s;\n}",
     [{"name":"basic","args":["Hello World"],"expected":"hello-world"}]),
    ("js-f08","js-strings","semiguided","initials","First letters uppercased.","function initials(name){\n  return '';\n}",
     [{"name":"two","args":["Ada Lovelace"],"expected":"AL"}]),
    ("js-f09","js-arrays","semiguided","unique","Unique, first-seen order.","function unique(xs){\n  return xs;\n}",
     [{"name":"dups","args":[[1,1,2,1]],"expected":[1,2]}]),
    ("js-f10","js-objects","guided","has_key","has_key(obj,k) true if k in obj.","function has_key(obj, k){\n  return false;\n}",
     [{"name":"yes","args":[{"a":1},"a"],"expected":True},{"name":"no","args":[{"a":1},"b"],"expected":False}]),
    ("js-f11","js-functions","semiguided","average","Mean, empty is 0.","function average(xs){\n  return 0;\n}",
     [{"name":"two","args":[[2,4]],"expected":3},{"name":"empty","args":[[]],"expected":0}]),
    ("js-f12","js-arrays","challenge","max_by_amount","Return the object with the largest amount.","function max_by_amount(rows){\n  return null;\n}",
     [{"name":"pick","args":[[{"id":1,"amount":3},{"id":2,"amount":9}]],"expected":{"id":2,"amount":9}}]),
    ("js-f13","js-strings","challenge","parse_kv","'a=1' -> {a:'1'}. Only one pair.","function parse_kv(s){\n  return {};\n}",
     [{"name":"one","args":["a=1"],"expected":{"a":"1"}}]),
    ("js-f14","js-strings","guided","starts_with_https","True if starts with https://.","function starts_with_https(s){\n  return false;\n}",
     [{"name":"ok","args":["https://x.com"],"expected":True},{"name":"http","args":["http://x"],"expected":False}]),
    ("js-f15","js-arrays","guided","sum_range","Inclusive sum lo..hi.","function sum_range(lo, hi){\n  return 0;\n}",
     [{"name":"1-3","args":[1,3],"expected":6}]),
    ("js-f16","js-objects","semiguided","pick","Keep only listed keys.","function pick(obj, keys){\n  return {};\n}",
     [{"name":"ac","args":[{"a":1,"b":2,"c":3},["a","c"]],"expected":{"a":1,"c":3}}]),
    ("js-f17","js-arrays","challenge","chunk","chunk(xs,2).","function chunk(xs, n){\n  return [];\n}",
     [{"name":"five","args":[[1,2,3,4,5],2],"expected":[[1,2],[3,4],[5]]}]),
    ("js-f18","js-arrays","semiguided","flatten_one","Flatten one level.","function flatten_one(xs){\n  return xs;\n}",
     [{"name":"mix","args":[[[1,2],3]],"expected":[1,2,3]}]),
    ("js-f19","js-strings","challenge","mask_email","a**@domain.","function mask_email(e){\n  return e;\n}",
     [{"name":"ada","args":["ada@site.com"],"expected":"a**@site.com"}]),
    ("js-f20","js-functions","mastery","deep_equal","JSON-like equality.","function deep_equal(a, b){\n  return a === b;\n}",
     [{"name":"obj","args":[{"x":[1]},{"x":[1]}],"expected":True},{"name":"diff","args":[{"x":1},{"x":2}],"expected":False}]),
    ("js-f21","js-functions","guided","triple","Return n * 3.","function triple(n){\n  return 0;\n}",
     [{"name":"4","args":[4],"expected":12}]),
    ("js-f22","js-arrays","guided","last","Last element or null.","function last(xs){\n  return null;\n}",
     [{"name":"has","args":[[1,2,9]],"expected":9},{"name":"empty","args":[[]],"expected":None}]),
    ("js-f23","js-strings","guided","title_case","First letter upper, rest lower, per word.","function title_case(s){\n  return s;\n}",
     [{"name":"two","args":["ada lovelace"],"expected":"Ada Lovelace"}]),
    ("js-f24","js-objects","guided","values_sum","Sum numeric Object.values.","function values_sum(obj){\n  return 0;\n}",
     [{"name":"ab","args":[{"a":2,"b":5}],"expected":7}]),
    ("js-f25","js-arrays","semiguided","zip_sum","zip_sum([1,2],[3,4]) -> [4,6]. Same length.","function zip_sum(a, b){\n  return [];\n}",
     [{"name":"two","args":[[1,2],[3,4]],"expected":[4,6]}]),
    ("js-f26","js-functions","semiguided","safe_div","a/b, or null if b is 0.","function safe_div(a, b){\n  return 0;\n}",
     [{"name":"ok","args":[10,2],"expected":5},{"name":"zero","args":[1,0],"expected":None}]),
    ("js-f27","js-arrays","challenge","index_by_id","[{id:'a',n:1}] -> {a:{id:'a',n:1}}.","function index_by_id(rows){\n  return {};\n}",
     [{"name":"one","args":[[{"id":"a","n":1}]],"expected":{"a":{"id":"a","n":1}}}]),
    ("js-f28","js-strings","semiguided","count_vowels","Count aeiou, case-insensitive.","function count_vowels(s){\n  return 0;\n}",
     [{"name":"Ada","args":["Ada"],"expected":2}]),
    ("js-f29","js-functions","challenge","compose_sum","compose_sum(f,g)(x) is f(g(x)) for numeric f,g passed as... wait skip"),
    ("js-f30","js-arrays","mastery","median","Median of numbers. Odd length.","function median(xs){\n  return 0;\n}",
     [{"name":"three","args":[[9,1,5]],"expected":5}]),
]

# replace broken f29
js_clean[28] = ("js-f29","js-objects","challenge","omit","omit({a:1,b:2}, ['b']) -> {a:1}.","function omit(obj, keys){\n  return obj;\n}",
    [{"name":"drop b","args":[{"a":1,"b":2},["b"]],"expected":{"a":1}}])

js_more = [
    ("js-f31","js-arrays","guided","includes_id","True if some row.id === id.","function includes_id(rows, id){\n  return false;\n}",
     [{"name":"yes","args":[[{"id":"x"}],"x"],"expected":True},{"name":"no","args":[[{"id":"x"}],"z"],"expected":False}]),
    ("js-f32","js-functions","guided","pct","pct(part, whole) rounded to 1 decimal. 1,4 -> 25.","function pct(part, whole){\n  return 0;\n}",
     [{"name":"quarter","args":[1,4],"expected":25}]),
    ("js-f33","js-strings","guided","trim_lower","trim + lower.","function trim_lower(s){\n  return s;\n}",
     [{"name":"pad","args":["  Hi "],"expected":"hi"}]),
    ("js-f34","js-arrays","semiguided","sort_by_name","Sort copy by name ascending.","function sort_by_name(rows){\n  return rows;\n}",
     [{"name":"ab","args":[[{"name":"b"},{"name":"a"}]],"expected":[{"name":"a"},{"name":"b"}]}]),
    ("js-f35","js-objects","semiguided","merge","Shallow merge, b wins.","function merge(a, b){\n  return a;\n}",
     [{"name":"win","args":[{"a":1,"b":2},{"b":9}],"expected":{"a":1,"b":9}}]),
    ("js-f36","js-functions","challenge","range","range(3) -> [0,1,2].","function range(n){\n  return [];\n}",
     [{"name":"3","args":[3],"expected":[0,1,2]}]),
    # The function name here must match the starter exactly or the task cannot
    # be passed: the grader looks up the name it was given.
    ("js-f37","js-arrays","challenge","partition_even",
     "Split into two lists: evens first, then odds. partition_even([1,2,3,4]) is [[2,4],[1,3]]. Keep the original order inside each list.",
     "function partition_even(xs){\n  return xs;\n}",
     [{"name":"mix","args":[[1,2,3,4]],"expected":[[2,4],[1,3]]},
      {"name":"all evens","args":[[2,4]],"expected":[[2,4],[]]},
      {"name":"empty","args":[[]],"expected":[[],[]]}]),
    ("js-f38","js-strings","mastery","is_palindrome","Ignore case and spaces.","function is_palindrome(s){\n  return false;\n}",
     [{"name":"race","args":["Race car"],"expected":True},{"name":"no","args":["hello"],"expected":False}]),
    ("js-f39","js-arrays","mastery","top_n_by_amount",
     "Return the names of the n highest rows by amount, largest first. Break ties on amount by name, A to Z. "
     "An n larger than the list returns everything; an n of 0 or less returns [].",
     "function top_n_by_amount(rows, n){\n  return [];\n}",
     [{"name":"highest first","args":[[{"name":"a","amount":5},{"name":"b","amount":9}],1],"expected":["b"]},
      {"name":"ties break on name","args":[[{"name":"b","amount":5},{"name":"a","amount":5}],2],"expected":["a","b"]},
      {"name":"n larger than the list","args":[[{"name":"a","amount":1}],5],"expected":["a"]},
      {"name":"n of zero returns nothing","args":[[{"name":"a","amount":1}],0],"expected":[]},
      {"name":"a negative n returns nothing","args":[[{"name":"a","amount":1}],-2],"expected":[]},
      {"name":"an empty list","args":[[],3],"expected":[]}]),
    ("js-f40","js-arrays","mastery","running_total","[1,2,3] -> [1,3,6].","function running_total(xs){\n  return [];\n}",
     [{"name":"three","args":[[1,2,3]],"expected":[1,3,6]}]),
]
js_clean.extend(js_more)

for t in js_clean:
    tid, skill, level, fname, prompt, starter, cases = t[0], t[1], t[2], t[3], t[4], t[5], t[6]
    tasks.append({
        "id": tid, "skill": skill, "tool": "js", "level": level, "kind": "js",
        "title": fname.replace("_", " "), "prompt": prompt, "functionName": fname,
        "starter": starter, "testCases": json.dumps(cases), "prerequisite": "[]",
    })

# ---- Judgment libraries (graded, not multiple choice) ----
# specs: write the acceptance criteria. git: write the command. review:
# verdict plus a written reason per hunk. detective: charge sheet then proof.
tasks.extend(SPEC_TASKS)
tasks.extend(GIT_TASKS)
tasks.extend(REVIEW_TASKS)
tasks.extend(DETECTIVE_TASKS)

# Testing 20
test_items = [
    ("ts-f01","testing-assertions","guided","test_sum","Write test_sum(impl) that returns true if impl(2,3)===5 and false if impl(2,3)!==5.",
     "function test_sum(impl){\n  return true;\n}",
     "function(a,b){return a+b;}", "function(a,b){return a-b;}",
     "The bad impl subtracts. Your test must return false."),
    ("ts-f02","testing-assertions","guided","test_greet","test_greet(impl): impl('Ada') should be 'Hello, Ada'.",
     "function test_greet(impl){\n  return true;\n}",
     "function(n){return 'Hello, '+n;}", "function(n){return n;}",
     "Bad impl returns the name only."),
    ("ts-f03","testing-assertions","guided","test_empty_sum","test_empty_sum(impl): impl([]) === 0.",
     "function test_empty_sum(impl){\n  return true;\n}",
     "function(xs){return xs.reduce((a,b)=>a+b,0);}", "function(xs){return 99;}",
     "Empty list must be 0, not a leftover."),
    ("ts-f04","testing-assertions","semiguided","test_clamp_high","test_clamp_high(impl): impl(50,0,10)===10.",
     "function test_clamp_high(impl){\n  return true;\n}",
     "function(n,lo,hi){return Math.min(hi,Math.max(lo,n));}", "function(n,lo,hi){return n;}",
     "Bad impl ignores the high bound."),
    ("ts-f05","testing-assertions","semiguided","test_unique","test_unique(impl): impl([1,1,2]) deep-equals [1,2].",
     "function test_unique(impl){\n  return true;\n}",
     "function(xs){return [...new Set(xs)];}", "function(xs){return xs;}",
     "Bad impl keeps duplicates. Use JSON.stringify to compare."),
    ("ts-f06","testing-assertions","semiguided","test_slug","test_slug(impl): impl('Hi There')==='hi-there'.",
     "function test_slug(impl){\n  return true;\n}",
     "function(s){return s.toLowerCase().replace(/ /g,'-');}", "function(s){return s.toLowerCase();}",
     "Bad impl forgets hyphens."),
    ("ts-f07","testing-mutations","challenge","test_safe_div","test_safe_div(impl): impl(1,0)===null and impl(8,2)===4.",
     "function test_safe_div(impl){\n  return true;\n}",
     "function(a,b){return b===0?null:a/b;}", "function(a,b){return a/b;}",
     "Bad impl divides by zero (Infinity). You must check the zero case."),
    ("ts-f08","testing-mutations","challenge","test_last","test_last(impl): impl([])===null and impl([1,2])===2.",
     "function test_last(impl){\n  return true;\n}",
     "function(xs){return xs.length?xs[xs.length-1]:null;}", "function(xs){return xs[0];}",
     "Bad impl returns the first element."),
    ("ts-f09","testing-assertions","guided","test_is_even","impl(2)===true, impl(3)===false.",
     "function test_is_even(impl){\n  return true;\n}",
     "function(n){return n%2===0;}", "function(n){return true;}",
     "Bad impl always returns true."),
    ("ts-f10","testing-assertions","guided","test_triple","impl(3)===9.",
     "function test_triple(impl){\n  return true;\n}",
     "function(n){return n*3;}", "function(n){return n+3;}",
     "Bad impl adds 3."),
    ("ts-f11","testing-mutations","semiguided","test_pick","impl({a:1,b:2},['a']) deep-equals {a:1}.",
     "function test_pick(impl){\n  return true;\n}",
     "function(o,ks){const r={};ks.forEach(k=>r[k]=o[k]);return r;}", "function(o,ks){return o;}",
     "Bad impl returns the whole object."),
    ("ts-f12","testing-mutations","semiguided","test_starts_https","impl('https://x')===true, impl('http://x')===false.",
     "function test_starts_https(impl){\n  return true;\n}",
     "function(s){return s.startsWith('https://');}", "function(s){return s.startsWith('http');}",
     "Bad impl treats http as https."),
    ("ts-f13","testing-mutations","challenge","test_mask","impl('ada@site.com')==='a**@site.com'.",
     "function test_mask(impl){\n  return true;\n}",
     "function(e){const [u,d]=e.split('@');return u[0]+'**@'+d;}", "function(e){return e;}",
     "Bad impl returns the raw email."),
    ("ts-f14","testing-assertions","guided","test_pct","impl(1,4)===25.",
     "function test_pct(impl){\n  return true;\n}",
     "function(p,w){return (p/w)*100;}", "function(p,w){return p/w;}",
     "Bad impl forgets *100."),
    ("ts-f15","testing-assertions","semiguided","test_title","impl('ada lovelace')==='Ada Lovelace'.",
     "function test_title(impl){\n  return true;\n}",
     "function(s){return s.split(' ').map(w=>w[0].toUpperCase()+w.slice(1).toLowerCase()).join(' ');}", "function(s){return s.toUpperCase();}",
     "Bad impl screams the whole string."),
    ("ts-f16","testing-mutations","challenge","test_running","impl([1,2,3]) deep-equals [1,3,6].",
     "function test_running(impl){\n  return true;\n}",
     "function(xs){let t=0;return xs.map(x=>t+=x);}", "function(xs){return xs;}",
     "Bad impl returns the input unchanged."),
    ("ts-f17","testing-mutations","mastery","test_palindrome","impl('Race car')===true, impl('hello')===false.",
     "function test_palindrome(impl){\n  return true;\n}",
     "function(s){const n=s.toLowerCase().replace(/ /g,'');return n===n.split('').reverse().join('');}", "function(s){return s===s.split('').reverse().join('');}",
     "Bad impl is case-sensitive and fails on Race car."),
    ("ts-f18","testing-assertions","guided","test_has_key","impl({a:1},'a')===true, impl({a:1},'z')===false.",
     "function test_has_key(impl){\n  return true;\n}",
     "function(o,k){return Object.prototype.hasOwnProperty.call(o,k);}", "function(o,k){return true;}",
     "Bad impl always true."),
    ("ts-f19","testing-assertions","semiguided","test_chunk","impl([1,2,3,4,5],2) deep-equals [[1,2],[3,4],[5]].",
     "function test_chunk(impl){\n  return true;\n}",
     "function(xs,n){const o=[];for(let i=0;i<xs.length;i+=n)o.push(xs.slice(i,i+n));return o;}", "function(xs,n){return [xs];}",
     "Bad impl wraps the whole array once."),
    ("ts-f20","testing-mutations","mastery","test_omit","impl({a:1,b:2},['b']) deep-equals {a:1}.",
     "function test_omit(impl){\n  return true;\n}",
     "function(o,ks){const r={};Object.keys(o).forEach(k=>{if(!ks.includes(k))r[k]=o[k];});return r;}", "function(o,ks){return o;}",
     "Bad impl returns the original object."),
]
for t in test_items:
    tasks.append({
        "id": t[0], "skill": t[1], "tool": "testing", "level": t[2], "kind": "testing",
        "title": t[3].replace("_", " "), "prompt": t[4], "functionName": t[3],
        "starter": t[5], "goodImpl": t[6], "badImpl": t[7], "bugHint": t[8],
        "prerequisite": "[]",
    })

# Python 25
py_items = [
    ("py-f01","python-basics","guided","total_revenue","Sum order['amount']. Empty is 0.",
     "def total_revenue(orders):\n    return 0\n",
     [[{"amount": 10}, {"amount": 2.5}], []], [12.5, 0]),
    ("py-f02","python-basics","guided","greet","greet('Ada') -> 'Hello, Ada'.",
     "def greet(name):\n    return ''\n",
     ["Ada"], ["Hello, Ada"]),
    ("py-f03","python-basics","guided","is_even","True if n even.",
     "def is_even(n):\n    return False\n",
     [2, 3], [True, False]),
    ("py-f04","python-json","guided","pluck_names","List of name fields.",
     "def pluck_names(rows):\n    return []\n",
     [[{"name": "A"}, {"name": "B"}]], [["A", "B"]]),
    ("py-f05","python-json","semiguided","count_status","Count matching status.",
     "def count_status(rows, target):\n    return 0\n",
     None, None),
    ("py-f06","python-basics","semiguided","clamp","Keep n in [lo, hi].",
     "def clamp(n, lo, hi):\n    return n\n",
     None, None),
    ("py-f07","python-strings","guided","slugify","Lowercase, spaces to -.",
     "def slugify(s):\n    return s\n",
     ["Hello World"], ["hello-world"]),
    ("py-f08","python-strings","semiguided","initials","'Ada Lovelace' -> 'AL'.",
     "def initials(name):\n    return ''\n",
     ["Ada Lovelace"], ["AL"]),
    ("py-f09","python-json","semiguided","unique","Unique first-seen.",
     "def unique(xs):\n    return xs\n",
     [[1, 1, 2, 1]], [[1, 2]]),
    ("py-f10","python-files","guided","parse_kv_line","'a=1' -> {'a':'1'}.",
     "def parse_kv_line(s):\n    return {}\n",
     ["a=1"], [{"a": "1"}]),
    ("py-f11","python-basics","guided","average","Mean, empty 0.",
     "def average(xs):\n    return 0\n",
     [[2, 4], []], [3, 0]),
    ("py-f12","python-json","challenge","max_by_amount","Object with max amount.",
     "def max_by_amount(rows):\n    return None\n",
     [[{"id": 1, "amount": 3}, {"id": 2, "amount": 9}]], [{"id": 2, "amount": 9}]),
    ("py-f13","python-files","challenge","load_ids","From lines of text, return stripped non-empty lines.",
     "def load_ids(text):\n    return []\n",
     ["a\n\nb\n"], [["a", "b"]]),
    ("py-f14","python-strings","guided","starts_with_https","True if startswith https://.",
     "def starts_with_https(s):\n    return False\n",
     ["https://x.com", "http://x"], [True, False]),
    ("py-f15","python-basics","semiguided","safe_div","None if b==0 else a/b.",
     "def safe_div(a, b):\n    return 0\n",
     None, None),
    ("py-f16","python-json","semiguided","pick","Keep listed keys.",
     "def pick(obj, keys):\n    return {}\n",
     None, None),
    ("py-f17","python-json","challenge","chunk","chunk(xs, 2).",
     "def chunk(xs, n):\n    return []\n",
     [[1, 2, 3, 4, 5], 2], [[[1, 2], [3, 4], [5]]]),
    ("py-f18","python-strings","challenge","mask_email","a**@domain.",
     "def mask_email(e):\n    return e\n",
     ["ada@site.com"], ["a**@site.com"]),
    ("py-f19","python-files","mastery","word_count","Count whitespace-separated words.",
     "def word_count(text):\n    return 0\n",
     ["one two three"], [3]),
    ("py-f20","python-json","mastery","merge","Shallow merge, b wins.",
     "def merge(a, b):\n    return a\n",
     [{"a": 1, "b": 2}, {"b": 9}], [{"a": 1, "b": 9}]),
    ("py-f21","python-basics","guided","triple","n * 3.",
     "def triple(n):\n    return 0\n",
     [4], [12]),
    ("py-f22","python-basics","guided","last","Last or None.",
     "def last(xs):\n    return None\n",
     [[1, 2, 9], []], [9, None]),
    ("py-f23","python-strings","semiguided","title_case","Title case words.",
     "def title_case(s):\n    return s\n",
     ["ada lovelace"], ["Ada Lovelace"]),
    ("py-f24","python-json","challenge","index_by_id","id -> object.",
     "def index_by_id(rows):\n    return {}\n",
     [[{"id": "a", "n": 1}]], [{"a": {"id": "a", "n": 1}}]),
    ("py-f25","python-files","mastery","running_total","[1,2,3] -> [1,3,6].",
     "def running_total(xs):\n    return []\n",
     [[1, 2, 3]], [[1, 3, 6]]),
]

# Python tasks with simple single/multi cases encoded as JS testCases for the browser JS grader
# Module 8 uses Pyodide; practice-python will use JS-equivalent via a python-in-comment? 
# We'll grade Python practice with Pyodide harness in the page. Store ref as testCases for a JS twin? 
# Simpler: grade Python with the same JS functionName pattern but student writes Python
# and practice-python.html uses Pyodide. For the generator, emit testCases as JSON
# plus kind: python.

for t in py_items:
    tid, skill, level, fname, prompt, starter = t[0], t[1], t[2], t[3], t[4], t[5]
    args_list, exp_list = t[6], t[7]
    cases = []
    if args_list is None:
        # specials
        if fname == "count_status":
            cases = [{"name": "open", "args": [[{"status": "open"}, {"status": "done"}], "open"], "expected": 1}]
        elif fname == "clamp":
            cases = [{"name": "hi", "args": [50, 0, 10], "expected": 10}]
        elif fname == "safe_div":
            cases = [{"name": "z", "args": [1, 0], "expected": None}, {"name": "ok", "args": [8, 2], "expected": 4}]
        elif fname == "pick":
            cases = [{"name": "a", "args": [{"a": 1, "b": 2}, ["a"]], "expected": {"a": 1}}]
        elif fname == "chunk":
            cases = [{"name": "2", "args": [[1, 2, 3, 4, 5], 2], "expected": [[1, 2], [3, 4], [5]]}]
        elif fname == "merge":
            cases = [{"name": "win", "args": [{"a": 1, "b": 2}, {"b": 9}], "expected": {"a": 1, "b": 9}}]
    else:
        # pair args with expected - args_list may be list of args OR list of single args
        if fname in ("total_revenue", "average", "last"):
            for a, e in zip(args_list, exp_list):
                cases.append({"name": str(e), "args": [a], "expected": e})
        elif fname in ("is_even", "triple", "starts_with_https"):
            for a, e in zip(args_list, exp_list):
                cases.append({"name": str(a), "args": [a], "expected": e})
        elif fname == "max_by_amount":
            cases = [{"name": "pick", "args": args_list, "expected": exp_list[0]}]
        elif fname == "chunk":
            cases = [{"name": "2", "args": args_list, "expected": exp_list[0]}]
        elif fname == "merge":
            cases = [{"name": "win", "args": args_list, "expected": exp_list[0]}]
        elif fname == "index_by_id":
            cases = [{"name": "one", "args": args_list, "expected": exp_list[0]}]
        elif isinstance(args_list[0], list) and fname in ("pluck_names", "unique", "running_total"):
            cases = [{"name": "main", "args": [args_list[0]], "expected": exp_list[0]}]
        else:
            cases = [{"name": "main", "args": args_list if isinstance(args_list, list) and args_list and not isinstance(args_list[0], (str, int, dict)) else [args_list[0]] if len(args_list)==1 or isinstance(args_list[0], str) else args_list, "expected": exp_list[0] if exp_list else None}]
            if fname in ("greet", "slugify", "initials", "parse_kv_line", "load_ids", "mask_email", "word_count", "title_case"):
                cases = [{"name": "main", "args": [args_list[0]], "expected": exp_list[0]}]
    tasks.append({
        "id": tid, "skill": skill, "tool": "python", "level": level, "kind": "python",
        "title": fname.replace("_", " "), "prompt": prompt, "functionName": fname,
        "starter": starter, "testCases": json.dumps(cases), "prerequisite": "[]",
    })

tasks.extend(INTEGRATED_TASKS)

# Emit JS
lines = [
    "/* Generated task catalog. Do not hand-edit counts without re-running scripts/_gen_aise_tasks.py */",
    "(function (global) {",
    "const TASKS = [",
]
for t in tasks:
    fields = []
    for k, v in t.items():
        if k in ("checks", "testCases", "options", "goodImpl", "badImpl", "prerequisite") and isinstance(v, str):
            if k == "prerequisite":
                fields.append(f"{k}: {v}")
            elif k == "goodImpl" or k == "badImpl":
                fields.append(f"{k}: {json.dumps(v)}")
            elif k == "testCases" or k == "options" or k == "checks":
                fields.append(f"{k}: {v}")
            else:
                fields.append(f"{k}: {v}")
        else:
            fields.append(f"{k}: {json.dumps(v)}")
    lines.append("  { " + ", ".join(fields) + " },")
lines.append("];")
lines.append("global.AISE_TASKS = TASKS;")
lines.append("})(window);")
OUT.write_text("\n".join(lines), encoding="utf-8")
print("wrote", len(tasks), "tasks to", OUT)
from collections import Counter
print(Counter(t["tool"] for t in tasks))
