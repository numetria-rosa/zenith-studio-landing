def harness(student_code):
    ns = {}
    try:
        exec(student_code, ns)
        fn = ns.get('run_agent_loop')
        if fn is None or not callable(fn):
            return {'ranOk': False, 'error': 'run_agent_loop is not defined as a function.'}
    except Exception as e:
        return {'ranOk': False, 'error': str(e)}

    def safe_call(initial_state, step, max_steps):
        try:
            return {'threw': False, 'out': fn(initial_state, step, max_steps)}
        except Exception as e:
            return {'threw': True, 'out': None, 'errorMessage': str(e)}

    results = []

    calls = [0]
    def step1(state):
        calls[0] += 1
        if calls[0] < 3:
            return {'type': 'action', 'action': 'search_' + str(calls[0]), 'nextState': state}
        return {'type': 'final', 'answer': 'done'}
    r = safe_call({}, step1, 10)
    p = not r['threw'] and r['out'] and r['out']['status'] == 'success' and r['out']['answer'] == 'done' and r['out']['stepsUsed'] == 3
    results.append({'name': 'Loop terminates successfully when step returns a final answer', 'pass': p,
        "hint": "When step(state) returns {'type': 'final', 'answer': ...}, immediately return {'status': 'success', 'answer': ..., 'stepsUsed': ..., 'trace': trace}, stepsUsed should count this final call too.",
        'errorMessage': r.get('errorMessage') if r['threw'] else None})

    calls2 = [0]
    def step2(state):
        calls2[0] += 1
        return {'type': 'action', 'action': 'act_' + str(calls2[0]), 'nextState': state}
    r = safe_call({}, step2, 5)
    p = (not r['threw'] and r['out'] and r['out']['status'] == 'max_steps' and r['out']['stepsUsed'] == 5
         and isinstance(r['out']['trace'], list) and len(r['out']['trace']) == 5)
    results.append({'name': 'Loop stops at max_steps when step never finishes and never repeats', 'pass': p,
        "hint": "If the loop runs max_steps times without hitting 'final' or a stuck condition, return {'status': 'max_steps', 'stepsUsed': max_steps, 'trace': trace} after the loop ends.",
        'errorMessage': r.get('errorMessage') if r['threw'] else None})

    def step3(state):
        return {'type': 'action', 'action': 'poll_status', 'nextState': {}}
    r = safe_call({}, step3, 10)
    p = not r['threw'] and r['out'] and r['out']['status'] == 'stuck' and r['out']['stepsUsed'] == 3 and r['out']['stepsUsed'] < 10
    results.append({'name': "3 identical consecutive actions trigger 'stuck' well before max_steps is reached", 'pass': p,
        "hint": "Track the last action and a repeat counter. If the current action equals the last one, increment the counter; if it reaches 3, return {'status': 'stuck', 'stepsUsed': ..., 'trace': trace} immediately, don't keep looping to max_steps.",
        'errorMessage': r.get('errorMessage') if r['threw'] else None})

    calls4 = [0]
    seq4 = ['fetch', 'parse', 'fetch', 'parse']
    def step4(state):
        calls4[0] += 1
        if calls4[0] <= 4:
            return {'type': 'action', 'action': seq4[calls4[0] - 1], 'nextState': state}
        return {'type': 'final', 'answer': 'resolved'}
    r = safe_call({}, step4, 10)
    p = not r['threw'] and r['out'] and r['out']['status'] == 'success' and r['out']['answer'] == 'resolved' and r['out']['stepsUsed'] == 5
    results.append({'name': 'Alternating different actions reach success without falsely triggering stuck detection', 'pass': p,
        'hint': 'Your repeat counter must reset to 1 whenever the current action differs from the last one, not just increment unconditionally. fetch, parse, fetch, parse never repeats 3 TIMES IN A ROW.',
        'errorMessage': r.get('errorMessage') if r['threw'] else None})

    calls5 = [0]
    seq5 = ['fetch_page', 'parse_data', 'validate_result']
    def step5(state):
        calls5[0] += 1
        if calls5[0] <= 3:
            return {'type': 'action', 'action': seq5[calls5[0] - 1], 'nextState': state}
        return {'type': 'final', 'answer': 'ok'}
    r = safe_call({}, step5, 10)
    p = not r['threw'] and r['out'] and isinstance(r['out']['trace'], list) and r['out']['trace'] == seq5
    results.append({'name': 'trace records the exact sequence of actions taken, in the order they occurred', 'pass': p,
        "hint": "Append result['action'] onto the trace list every time step returns an 'action' result, before continuing the loop. Don't append anything for the final result itself.",
        'errorMessage': r.get('errorMessage') if r['threw'] else None})

    return {'ranOk': True, 'results': results}
