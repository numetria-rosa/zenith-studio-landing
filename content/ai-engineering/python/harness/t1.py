def harness(student_code):
    ns = {}
    try:
        exec(student_code, ns)
        fn = ns.get('estimate_tokens')
        if fn is None or not callable(fn):
            return {'ranOk': False, 'error': 'estimate_tokens is not defined as a function.'}
    except Exception as e:
        return {'ranOk': False, 'error': str(e)}
    def safe_call(text):
        try:
            return {'threw': False, 'out': fn(text)}
        except Exception as e:
            return {'threw': True, 'out': None, 'errorMessage': str(e)}
    results = []
    cases = [('', 0), ('abcd', 1), ('a' * 40, 10), ('a' * 7, 1), ('a' * 3, 0)]
    for text, expected in cases:
        r = safe_call(text)
        p = not r['threw'] and r['out'] == expected and isinstance(r['out'], int)
        results.append({'name': f'estimate_tokens with {len(text)} characters returns {expected}', 'pass': p,
            'hint': 'Use len(text) // 4 (floor division), and make sure you return an int.',
            'errorMessage': r.get('errorMessage') if r['threw'] else None})
    return {'ranOk': True, 'results': results}
