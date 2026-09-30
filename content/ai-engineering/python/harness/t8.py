async def harness(student_code):
    ns = {}
    try:
        exec(student_code, ns)
        fn = ns.get('fetch_first_success')
        if fn is None or not callable(fn):
            return {'ranOk': False, 'error': 'fetch_first_success is not defined as a function.'}
    except Exception as e:
        return {'ranOk': False, 'error': str(e)}
    async def safe_call(calls):
        try:
            return {'threw': False, 'out': await fn(calls)}
        except Exception as e:
            return {'threw': True, 'out': None, 'errorMessage': str(e)}
    results = []
    calls_made = [0]
    async def ok1():
        calls_made[0] += 1
        return 'primary result'
    async def unused1():
        calls_made[0] += 1
        return 'should not run'
    r = await safe_call([ok1, unused1])
    p = not r['threw'] and r['out'] == 'primary result' and calls_made[0] == 1
    results.append({'name': 'first call succeeding returns its result without trying the rest', 'pass': p,
        'hint': 'Return immediately from inside the loop on the first successful await, do not continue to later calls.',
        'errorMessage': r.get('errorMessage') if r['threw'] else None})
    async def bad2():
        raise Exception('primary down')
    async def ok2():
        return 'backup result'
    r = await safe_call([bad2, ok2])
    p = not r['threw'] and r['out'] == 'backup result'
    results.append({'name': 'first call raising falls through to the second, which succeeds', 'pass': p,
        'hint': 'Catch the exception from the failed call and continue the loop to the next one instead of stopping.',
        'errorMessage': r.get('errorMessage') if r['threw'] else None})
    async def bad3a():
        raise Exception('a down')
    async def bad3b():
        raise Exception('b down')
    r = await safe_call([bad3a, bad3b])
    p = not r['threw'] and r['out'] is None
    results.append({'name': 'every call raising returns None, never raises out of the function', 'pass': p,
        'hint': 'After the loop finishes without any call succeeding, return None as a clear failure signal.',
        'errorMessage': r.get('errorMessage') if r['threw'] else None})
    attempted = []
    async def track_a():
        attempted.append('a')
        raise Exception('a down')
    async def track_b():
        attempted.append('b')
        return 'b result'
    async def track_c():
        attempted.append('c')
        return 'c result'
    r = await safe_call([track_a, track_b, track_c])
    p = not r['threw'] and r['out'] == 'b result' and attempted == ['a', 'b']
    results.append({'name': 'stops trying further calls once one succeeds (c is never attempted)', 'pass': p,
        'hint': 'Once a call succeeds, return right away, do not keep looping through the remaining calls.',
        'errorMessage': r.get('errorMessage') if r['threw'] else None})
    async def only():
        return 'only result'
    r = await safe_call([only])
    p = not r['threw'] and r['out'] == 'only result'
    results.append({'name': 'a single-call list that succeeds returns its result', 'pass': p,
        'hint': 'The logic should work identically for a list of exactly one call.',
        'errorMessage': r.get('errorMessage') if r['threw'] else None})
    return {'ranOk': True, 'results': results}
