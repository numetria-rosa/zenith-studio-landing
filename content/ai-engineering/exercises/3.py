def harness(student_code):
    ns = {}
    try:
        exec(student_code, ns)
        fn = ns.get('retrieve_top_k')
        if fn is None or not callable(fn):
            return {'ranOk': False, 'error': 'retrieve_top_k is not defined as a function.'}
    except Exception as e:
        return {'ranOk': False, 'error': str(e)}

    def safe_call(query, docs, k, min_score):
        try:
            return {'threw': False, 'out': fn(query, docs, k, min_score)}
        except Exception as e:
            return {'threw': True, 'out': None, 'errorMessage': str(e)}

    results = []

    docs = [{'id': 'A', 'vector': [1, 0]}, {'id': 'B', 'vector': [0, 1]}, {'id': 'C', 'vector': [0.7, 0.7]}]
    r = safe_call([1, 0], docs, 3, -1)
    p = not r['threw'] and isinstance(r['out'], list) and len(r['out']) == 3
    if p:
        out = r['out']
        p = (out[0]['id'] == 'A' and out[1]['id'] == 'C' and out[2]['id'] == 'B'
             and abs(out[0]['score'] - 1) < 0.001 and abs(out[2]['score'] - 0) < 0.001)
    results.append({'name': 'Results are ranked by similarity, exact match scores highest and sorts first', 'pass': p,
        'hint': 'Sort your scored documents descending by score. The document with vector [1,0] against query [1,0] should score 1.0 and come first.',
        'errorMessage': r.get('errorMessage') if r['threw'] else None})

    docs = [{'id': 'D', 'vector': [1, 0]}, {'id': 'E', 'vector': [5, 0]}]
    r = safe_call([1, 0], docs, 2, -1)
    p = not r['threw'] and isinstance(r['out'], list) and len(r['out']) == 2
    if p:
        by_id = {x['id']: x['score'] for x in r['out']}
        p = abs(by_id['D'] - 1) < 0.001 and abs(by_id['E'] - 1) < 0.001
    results.append({'name': 'Cosine similarity ignores vector magnitude (scale-invariant)', 'pass': p,
        'hint': "Divide the dot product by the product of both vectors' magnitudes. [1,0] and [5,0] point the same direction, they should both score ~1.0 against a [1,0] query, regardless of length.",
        'errorMessage': r.get('errorMessage') if r['threw'] else None})

    docs = [{'id': 'A', 'vector': [1, 0]}, {'id': 'B', 'vector': [-1, 0]}]
    r = safe_call([1, 0], docs, 5, 0)
    p = not r['threw'] and isinstance(r['out'], list) and len(r['out']) == 1 and r['out'][0]['id'] == 'A'
    results.append({'name': 'min_score excludes low-relevance documents even when k allows more', 'pass': p,
        'hint': 'Filter out any scored document with score < min_score BEFORE slicing to k. Document B (opposite direction, score -1) should be excluded when min_score is 0, even though k=5 would otherwise have room for it.',
        'errorMessage': r.get('errorMessage') if r['threw'] else None})

    docs = [{'id': 'low', 'vector': [0.1, 0.995]}, {'id': 'high', 'vector': [0.99, 0.14]},
            {'id': 'mid', 'vector': [0.7, 0.7]}, {'id': 'zero', 'vector': [0, 1]}]
    r = safe_call([1, 0], docs, 2, -1)
    p = (not r['threw'] and isinstance(r['out'], list) and len(r['out']) == 2
         and r['out'][0]['id'] == 'high' and r['out'][1]['id'] == 'mid')
    results.append({'name': 'k limits output to the top-k highest scores, regardless of input order', 'pass': p,
        'hint': 'Score every document first, then sort the FULL scored list descending, THEN slice to k. Slicing before sorting (or sorting the wrong direction) gives the wrong top-k.',
        'errorMessage': r.get('errorMessage') if r['threw'] else None})

    docs = [{'id': 'zero', 'vector': [0, 0]}, {'id': 'normal', 'vector': [1, 0]}]
    r = safe_call([1, 0], docs, 5, -1)
    p = not r['threw'] and isinstance(r['out'], list) and len(r['out']) == 2
    if p:
        zero_entry = next((x for x in r['out'] if x['id'] == 'zero'), None)
        import math
        p = (zero_entry is not None and isinstance(zero_entry['score'], (int, float))
             and math.isfinite(zero_entry['score']) and abs(zero_entry['score'] - 0) < 0.001)
    results.append({'name': 'A zero-length document vector scores 0 and never raises or produces NaN', 'pass': p,
        'hint': 'Before dividing by the product of magnitudes, check if either magnitude is 0. If so, return a score of 0 for that pair instead of dividing by zero.',
        'errorMessage': r.get('errorMessage') if r['threw'] else None})

    return {'ranOk': True, 'results': results}
