async def harness(student_code):
    ns = {}
    try:
        exec(student_code, ns)
        fn = ns.get('call_with_retry_fallback')
        if fn is None or not callable(fn):
            return {'ranOk': False, 'error': 'call_with_retry_fallback is not defined as a function.'}
    except Exception as e:
        return {'ranOk': False, 'error': str(e)}

    async def safe_call(primary, fallback, max_retries):
        try:
            return {'threw': False, 'out': await fn(primary, fallback, max_retries)}
        except Exception as e:
            return {'threw': True, 'out': None, 'errorMessage': str(e)}

    def mk_error(msg, retryable=None):
        e = Exception(msg)
        if retryable is not None:
            e.retryable = retryable
        return e

    results = []

    fallback_calls = [0]
    async def primary1():
        return 'primary-ok'
    async def fallback1():
        fallback_calls[0] += 1
        return 'fallback-ok'
    r = await safe_call(primary1, fallback1, 3)
    p = (not r['threw'] and r['out'] and r['out']['ok'] is True and r['out']['result'] == 'primary-ok'
         and r['out']['source'] == 'primary' and fallback_calls[0] == 0)
    results.append({'name': 'Primary succeeds on first try, fallback is never called', 'pass': p,
        "hint": "If primary_call() succeeds, return immediately with source: 'primary'. Don't call fallback_call at all in this case.",
        'errorMessage': r.get('errorMessage') if r['threw'] else None})

    primary_calls2 = [0]
    fallback_calls2 = [0]
    async def primary2():
        primary_calls2[0] += 1
        if primary_calls2[0] < 3:
            raise mk_error('rate limited', True)
        return 'recovered'
    async def fallback2():
        fallback_calls2[0] += 1
        return 'fallback-ok'
    r = await safe_call(primary2, fallback2, 2)
    p = (not r['threw'] and r['out'] and r['out']['ok'] is True and r['out']['result'] == 'recovered'
         and r['out']['source'] == 'primary' and primary_calls2[0] == 3 and fallback_calls2[0] == 0)
    results.append({'name': 'Retries a retryable failure and succeeds on a later primary attempt, without ever calling fallback', 'pass': p,
        "hint": "On a retryable error (getattr(e, 'retryable', True) is not False), if you haven't hit max_retries yet, increment your attempt counter and call primary_call again, don't fall back yet.",
        'errorMessage': r.get('errorMessage') if r['threw'] else None})

    primary_calls3 = [0]
    async def primary3():
        primary_calls3[0] += 1
        raise mk_error('bad request', False)
    async def fallback3():
        return 'fallback-ok'
    r = await safe_call(primary3, fallback3, 5)
    p = (not r['threw'] and r['out'] and r['out']['ok'] is True and r['out']['result'] == 'fallback-ok'
         and r['out']['source'] == 'fallback' and primary_calls3[0] == 1)
    results.append({'name': 'A non-retryable error stops retrying immediately (1 primary call) and goes straight to fallback, even with max_retries much higher', 'pass': p,
        "hint": "Check e.retryable first. If it's explicitly False, break out of the retry loop right away regardless of the attempt count or max_retries, don't wait for the retry budget to run out.",
        'errorMessage': r.get('errorMessage') if r['threw'] else None})

    primary_calls4 = [0]
    fallback_calls4 = [0]
    async def primary4():
        primary_calls4[0] += 1
        raise mk_error('still failing', True)
    async def fallback4():
        fallback_calls4[0] += 1
        return 'fallback-ok'
    r = await safe_call(primary4, fallback4, 2)
    p = (not r['threw'] and r['out'] and r['out']['ok'] is True and r['out']['source'] == 'fallback'
         and primary_calls4[0] == 3 and fallback_calls4[0] == 1)
    results.append({'name': 'Exhausting max_retries on a retryable error still calls fallback exactly once (primary tried max_retries+1 times)', 'pass': p,
        'hint': 'With max_retries=2, the primary should be attempted 3 total times (1 initial + 2 retries) before falling through to a SINGLE fallback attempt.',
        'errorMessage': r.get('errorMessage') if r['threw'] else None})

    async def primary5():
        raise mk_error('primary down', True)
    async def fallback5():
        raise mk_error('fallback down', True)
    r = await safe_call(primary5, fallback5, 1)
    p = not r['threw'] and r['out'] and r['out']['ok'] is False and isinstance(r['out'].get('error'), str) and r['out']['source'] == 'fallback'
    results.append({'name': 'If both primary and fallback fail, returns a clear structured failure instead of raising', 'pass': p,
        "hint": "Wrap the single fallback attempt in its own try/except. If it also raises, return {'ok': False, 'error': str(e), 'source': 'fallback'} rather than letting the exception propagate out of your function.",
        'errorMessage': r.get('errorMessage') if r['threw'] else None})

    return {'ranOk': True, 'results': results}
