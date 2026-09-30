def harness(student_code):
    ns = {}
    try:
        exec(student_code, ns)
        fn = ns.get('batch')
        if fn is None or not callable(fn):
            return {'ranOk': False, 'error': 'batch is not defined as a function.'}
    except Exception as e:
        return {'ranOk': False, 'error': str(e)}
    def safe_call(items, size):
        try:
            return {'threw': False, 'out': fn(items, size)}
        except Exception as e:
            return {'threw': True, 'out': None, 'errorMessage': str(e)}
    results = []
    cases = [
        ([1,2,3,4,5], 2, [[1,2],[3,4],[5]]),
        ([], 3, []),
        ([1,2,3], 10, [[1,2,3]]),
        ([1,2,3], 1, [[1],[2],[3]]),
        (['a','b','c','d'], 2, [['a','b'],['c','d']]),
    ]
    for items, size, expected in cases:
        r = safe_call(items, size)
        p = not r['threw'] and r['out'] == expected
        results.append({'name': f'batch({items}, {size}) == {expected}', 'pass': p,
            'hint': 'Loop with for i in range(0, len(items), size), appending items[i:i+size] each time.',
            'errorMessage': r.get('errorMessage') if r['threw'] else None})
    return {'ranOk': True, 'results': results}
