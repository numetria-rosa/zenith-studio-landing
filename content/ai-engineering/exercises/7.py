def harness(student_code):
    ns = {}
    try:
        exec(student_code, ns)
        fn = ns.get('evaluate_model')
        if fn is None or not callable(fn):
            return {'ranOk': False, 'error': 'evaluate_model is not defined as a function.'}
    except Exception as e:
        return {'ranOk': False, 'error': str(e)}

    def safe_call(test_cases, model_fn, baseline_score):
        try:
            return {'threw': False, 'out': fn(test_cases, model_fn, baseline_score)}
        except Exception as e:
            return {'threw': True, 'out': None, 'errorMessage': str(e)}

    def approx_equal(a, b):
        return abs(a - b) < 0.001

    results = []

    test_cases = [
        {'id': 't1', 'input': 'a', 'check': lambda actual: actual == 'A'},
        {'id': 't2', 'input': 'b', 'check': lambda actual: actual == 'B'},
        {'id': 't3', 'input': 'c', 'check': lambda actual: actual == 'C'},
    ]
    model_fn = lambda x: x.upper()
    r = safe_call(test_cases, model_fn, None)
    p = (not r['threw'] and r['out'] and approx_equal(r['out']['score'], 1) and r['out']['passCount'] == 3
         and r['out']['total'] == 3 and r['out']['regression'] is False)
    results.append({'name': 'All test cases pass: score is 1, regression is false with no baseline provided', 'pass': p,
        "hint": "Call model_fn(tc['input']) then tc['check'](actual) for each case. score should be passCount/total. With no baseline_score, regression must be False, not None-but-truthy.",
        'errorMessage': r.get('errorMessage') if r['threw'] else None})

    test_cases2 = [
        {'id': 't1', 'input': 2, 'check': lambda actual: actual == 4},
        {'id': 't2', 'input': 3, 'check': lambda actual: actual == 999},
        {'id': 't3', 'input': 4, 'check': lambda actual: actual == 8},
        {'id': 't4', 'input': 5, 'check': lambda actual: actual == 111},
    ]
    model_fn2 = lambda x: x * 2
    r = safe_call(test_cases2, model_fn2, None)
    p = not r['threw'] and r['out'] and approx_equal(r['out']['score'], 0.5) and r['out']['passCount'] == 2 and r['out']['total'] == 4
    if p:
        by_id = {x['id']: x['pass'] for x in r['out']['results']}
        p = by_id['t1'] is True and by_id['t2'] is False and by_id['t3'] is True and by_id['t4'] is False
    results.append({'name': 'Mixed pass/fail: score reflects the true pass rate, and results correctly flag exactly which cases failed', 'pass': p,
        "hint": "Each entry in results should have pass set individually per test case, based on that case's own check(actual) call, not a single shared pass/fail value.",
        'errorMessage': r.get('errorMessage') if r['threw'] else None})

    test_cases3 = [
        {'id': 'ok1', 'input': 'fine', 'check': lambda actual: actual == 'FINE'},
        {'id': 'boom', 'input': 'explode', 'check': lambda actual: actual == 'EXPLODE'},
        {'id': 'ok2', 'input': 'safe', 'check': lambda actual: actual == 'SAFE'},
    ]
    def model_fn3(x):
        if x == 'explode':
            raise Exception('model call failed')
        return x.upper()
    r = safe_call(test_cases3, model_fn3, None)
    p = not r['threw'] and r['out'] and r['out']['total'] == 3 and r['out']['passCount'] == 2
    if p:
        by_id = {x['id']: x['pass'] for x in r['out']['results']}
        p = by_id['ok1'] is True and by_id['boom'] is False and by_id['ok2'] is True
    results.append({'name': 'A model_fn that raises for one case is caught and counted as a failure, without crashing the other cases', 'pass': p,
        "hint": "Wrap the model_fn(tc['input']) call in its own try/except. If it raises, that specific case is a fail, but keep processing the remaining test cases normally.",
        'errorMessage': r.get('errorMessage') if r['threw'] else None})

    test_cases_low = [
        {'id': 't1', 'input': 1, 'check': lambda actual: actual == 999},
        {'id': 't2', 'input': 2, 'check': lambda actual: actual == 999},
    ]
    test_cases_high = [
        {'id': 't1', 'input': 1, 'check': lambda actual: actual == 1},
        {'id': 't2', 'input': 2, 'check': lambda actual: actual == 2},
    ]
    model_fn4 = lambda x: x
    low = safe_call(test_cases_low, model_fn4, 0.75)
    high = safe_call(test_cases_high, model_fn4, 0.75)
    p = not low['threw'] and not high['threw'] and low['out']['regression'] is True and high['out']['regression'] is False
    results.append({'name': 'regression is true when score is below the baseline, and false when it meets or exceeds it', 'pass': p,
        'hint': 'regression should be (baseline_score is not None) AND (score < baseline_score). A score equal to or above the baseline is NOT a regression.',
        'errorMessage': (low.get('errorMessage') if low['threw'] else high.get('errorMessage') if high['threw'] else None)})

    def bad_check(actual):
        raise Exception('checker bug')
    test_cases5 = [
        {'id': 'safe', 'input': 'x', 'check': lambda actual: actual == 'X'},
        {'id': 'badcheck', 'input': 'y', 'check': bad_check},
    ]
    model_fn5 = lambda x: x.upper()
    r = safe_call(test_cases5, model_fn5, None)
    p = not r['threw'] and r['out'] and r['out']['total'] == 2
    if p:
        by_id = {x['id']: x['pass'] for x in r['out']['results']}
        p = by_id['safe'] is True and by_id['badcheck'] is False
    results.append({'name': 'A check() function that raises is treated as a failing check, not a crash of the whole evaluation', 'pass': p,
        "hint": "Wrap tc['check'](actual) in its own try/except too, separate from the model_fn try/except. If check() raises, that case is a fail, but every other case should still be evaluated normally.",
        'errorMessage': r.get('errorMessage') if r['threw'] else None})

    return {'ranOk': True, 'results': results}
