def harness(student_code):
    ns = {}
    try:
        exec(student_code, ns)
        fn = ns.get('parse_or_none')
        if fn is None or not callable(fn):
            return {'ranOk': False, 'error': 'parse_or_none is not defined as a function.'}
    except Exception as e:
        return {'ranOk': False, 'error': str(e)}
    def safe_call(text):
        try:
            return {'threw': False, 'out': fn(text)}
        except Exception as e:
            return {'threw': True, 'out': None, 'errorMessage': str(e)}
    results = []
    r = safe_call('{"status": "ok"}')
    p = not r['threw'] and r['out'] == {'status': 'ok'}
    results.append({'name': 'valid JSON object parses to a dict', 'pass': p,
        'hint': 'json.loads() of a valid object string returns a dict directly.', 'errorMessage': r.get('errorMessage') if r['threw'] else None})
    r = safe_call('[1, 2, 3]')
    p = not r['threw'] and r['out'] == [1, 2, 3]
    results.append({'name': 'valid JSON array parses to a list', 'pass': p,
        'hint': 'json.loads() also handles top-level arrays, returning a list.', 'errorMessage': r.get('errorMessage') if r['threw'] else None})
    r = safe_call('not json at all')
    p = not r['threw'] and r['out'] is None
    results.append({'name': 'invalid JSON returns None, never raises', 'pass': p,
        'hint': 'Catch the exception json.loads() raises on invalid input and return None instead of letting it propagate.',
        'errorMessage': r.get('errorMessage') if r['threw'] else None})
    r = safe_call('')
    p = not r['threw'] and r['out'] is None
    results.append({'name': 'empty string returns None', 'pass': p,
        'hint': 'An empty string is not valid JSON either, it should be caught the same way.', 'errorMessage': r.get('errorMessage') if r['threw'] else None})
    r = safe_call('42')
    p = not r['threw'] and r['out'] == 42
    results.append({'name': "a bare JSON number string like '42' parses to an int", 'pass': p,
        'hint': 'JSON top-level values can be numbers too, not just objects/arrays, json.loads("42") returns 42.',
        'errorMessage': r.get('errorMessage') if r['threw'] else None})
    return {'ranOk': True, 'results': results}
