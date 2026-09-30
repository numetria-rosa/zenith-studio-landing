def harness(student_code):
    ns = {}
    try:
        exec(student_code, ns)
        fn = ns.get('top_matches')
        if fn is None or not callable(fn):
            return {'ranOk': False, 'error': 'top_matches is not defined as a function.'}
    except Exception as e:
        return {'ranOk': False, 'error': str(e)}
    def safe_call(docs, min_score, limit):
        try:
            return {'threw': False, 'out': fn(docs, min_score, limit)}
        except Exception as e:
            return {'threw': True, 'out': None, 'errorMessage': str(e)}
    results = []
    docs = [{'id': 'a', 'score': 0.9}, {'id': 'b', 'score': 0.2}, {'id': 'c', 'score': 0.6}]
    r = safe_call(docs, 0.4, 2)
    p = not r['threw'] and [d['id'] for d in r['out']] == ['a', 'c']
    results.append({'name': 'filters below threshold, sorts descending, limits to 2', 'pass': p,
        'hint': 'Filter score >= min_score first, then sort descending by score, then slice to limit.',
        'errorMessage': r.get('errorMessage') if r['threw'] else None})
    r = safe_call(docs, 0.0, 10)
    p = not r['threw'] and [d['id'] for d in r['out']] == ['a', 'c', 'b']
    results.append({'name': 'limit higher than qualifying count returns all qualifying docs, sorted', 'pass': p,
        'hint': 'Slicing past the end of a list just returns everything available, no error.',
        'errorMessage': r.get('errorMessage') if r['threw'] else None})
    r = safe_call(docs, 0.95, 5)
    p = not r['threw'] and r['out'] == []
    results.append({'name': 'no docs qualifying returns an empty list', 'pass': p,
        'hint': 'If nothing clears min_score, the filtered list is empty before sorting/slicing even runs.',
        'errorMessage': r.get('errorMessage') if r['threw'] else None})
    unordered = [{'id': 'low', 'score': 0.1}, {'id': 'high', 'score': 0.99}, {'id': 'mid', 'score': 0.5}]
    r = safe_call(unordered, 0.0, 3)
    p = not r['threw'] and [d['id'] for d in r['out']] == ['high', 'mid', 'low']
    results.append({'name': 'result is correctly sorted regardless of input order', 'pass': p,
        'hint': 'Always sort AFTER filtering, using key=lambda d: d["score"], reverse=True.',
        'errorMessage': r.get('errorMessage') if r['threw'] else None})
    r = safe_call(docs, 0.5, 1)
    p = not r['threw'] and len(r['out']) == 1 and r['out'][0]['id'] == 'a'
    results.append({'name': 'limit=1 returns only the single best qualifying match', 'pass': p,
        'hint': 'After filtering and sorting, [:limit] with limit=1 keeps only the top entry.',
        'errorMessage': r.get('errorMessage') if r['threw'] else None})
    return {'ranOk': True, 'results': results}
