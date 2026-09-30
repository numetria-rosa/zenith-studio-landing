def harness(student_code):
    ns = {}
    try:
        exec(student_code, ns)
        fn = ns.get('merge_config')
        if fn is None or not callable(fn):
            return {'ranOk': False, 'error': 'merge_config is not defined as a function.'}
    except Exception as e:
        return {'ranOk': False, 'error': str(e)}
    def safe_call(defaults, overrides):
        try:
            return {'threw': False, 'out': fn(dict(defaults), dict(overrides))}
        except Exception as e:
            return {'threw': True, 'out': None, 'errorMessage': str(e)}
    results = []
    d = {'temperature': 0.7, 'max_tokens': 500}
    o = {'max_tokens': 1000}
    r = safe_call(d, o)
    p = not r['threw'] and r['out'] == {'temperature': 0.7, 'max_tokens': 1000}
    results.append({'name': 'overrides win on shared keys', 'pass': p,
        'hint': 'Return {**defaults, **overrides}.', 'errorMessage': r.get('errorMessage') if r['threw'] else None})
    d2 = {'a': 1, 'b': 2}
    r = safe_call(d2, {})
    p = not r['threw'] and r['out'] == {'a': 1, 'b': 2}
    results.append({'name': 'empty overrides returns an equivalent copy', 'pass': p,
        'hint': 'With no overrides, the result should equal defaults exactly.', 'errorMessage': r.get('errorMessage') if r['threw'] else None})
    d3 = {'x': 1}
    r = safe_call(d3, {'y': 2})
    p = not r['threw'] and r['out'] == {'x': 1, 'y': 2}
    results.append({'name': 'keys only in overrides are added', 'pass': p,
        'hint': 'A key present only in overrides should still appear in the result.', 'errorMessage': r.get('errorMessage') if r['threw'] else None})
    d4 = {'k': 1}
    original = dict(d4)
    fn(d4, {'k': 2})
    p = d4 == original
    results.append({'name': 'the original defaults dict is never mutated', 'pass': p,
        'hint': 'Build and return a NEW dict, e.g. {**defaults, **overrides}, do not call defaults.update(overrides).',
        'errorMessage': None})
    d5 = {'a': 1, 'b': 2}
    o5 = {'b': 3, 'c': 4}
    r = safe_call(d5, o5)
    p = not r['threw'] and r['out'] == {'a': 1, 'b': 3, 'c': 4}
    results.append({'name': 'a mix of shared and unique keys merges correctly', 'pass': p,
        'hint': 'Every key from both dicts should appear, with overrides winning any conflicts.', 'errorMessage': r.get('errorMessage') if r['threw'] else None})
    return {'ranOk': True, 'results': results}
