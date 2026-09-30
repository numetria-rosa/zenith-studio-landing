def harness(student_code):
    ns = {}
    try:
        exec(student_code, ns)
        fn = ns.get('safe_score')
        if fn is None or not callable(fn):
            return {'ranOk': False, 'error': 'safe_score is not defined as a function.'}
    except Exception as e:
        return {'ranOk': False, 'error': str(e)}
    def safe_call(a, b):
        try:
            return {'threw': False, 'out': fn(a, b)}
        except Exception as e:
            return {'threw': True, 'out': None, 'errorMessage': str(e)}
    results = []
    cases = [(10, 2, 5), (5, 0, None), (0, 5, 0), (-4, 2, -2), (7, 2, 3.5)]
    for a, b, expected in cases:
        r = safe_call(a, b)
        p = not r['threw'] and r['out'] == expected
        results.append({'name': f'safe_score({a}, {b}) == {expected}', 'pass': p,
            'hint': 'Wrap a / b in try/except ZeroDivisionError, returning None on that specific exception.',
            'errorMessage': r.get('errorMessage') if r['threw'] else None})
    return {'ranOk': True, 'results': results}
