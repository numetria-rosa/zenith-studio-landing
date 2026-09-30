def harness(student_code):
    ns = {}
    try:
        exec(student_code, ns)
        fn = ns.get('execute_tool')
        if fn is None or not callable(fn):
            return {'ranOk': False, 'error': 'execute_tool is not defined as a function.'}
    except Exception as e:
        return {'ranOk': False, 'error': str(e)}

    def safe_call(call, registry, seen):
        try:
            return {'threw': False, 'out': fn(call, registry, seen)}
        except Exception as e:
            return {'threw': True, 'out': None, 'errorMessage': str(e)}

    results = []

    registry = {'ping': {'schema': {'required': []}, 'handler': lambda args: 'pong'}}
    r = safe_call({'id': 'x1', 'name': 'nonexistent', 'arguments': {}}, registry, {})
    p = not r['threw'] and r['out'] and r['out']['ok'] is False and isinstance(r['out'].get('error'), str)
    results.append({'name': 'Unknown tool name returns a structured error instead of raising', 'pass': p,
        'hint': 'Look up the tool by call["name"] in the registry first. If it is not there, return {"ok": False, "error": ...} immediately, do not let a missing lookup crash anything.',
        'errorMessage': r.get('errorMessage') if r['threw'] else None})

    handler_calls = [0]
    def greet_handler(args):
        handler_calls[0] += 1
        return 'hi ' + args['name']
    registry = {'greet': {'schema': {'required': ['name']}, 'handler': greet_handler}}
    r = safe_call({'id': 'x2', 'name': 'greet', 'arguments': {}}, registry, {})
    p = not r['threw'] and r['out'] and r['out']['ok'] is False and handler_calls[0] == 0
    results.append({'name': 'Missing required argument is rejected before the handler ever runs', 'pass': p,
        'hint': 'Check every field in schema["required"] exists in call["arguments"] BEFORE calling the handler. If any is missing, return an error and do not call the handler at all.',
        'errorMessage': r.get('errorMessage') if r['threw'] else None})

    handler_calls2 = [0]
    def inc_handler(args):
        handler_calls2[0] += 1
        return handler_calls2[0]
    registry = {'inc': {'schema': {'required': []}, 'handler': inc_handler}}
    seen = {}
    first = safe_call({'id': 'dup1', 'name': 'inc', 'arguments': {}}, registry, seen)
    second = safe_call({'id': 'dup1', 'name': 'inc', 'arguments': {}}, registry, seen)
    p = (not first['threw'] and not second['threw'] and handler_calls2[0] == 1
         and first['out']['ok'] is True and second['out']['ok'] is True and first['out']['result'] == second['out']['result'])
    results.append({'name': 'Calling the same call["id"] twice only executes the handler once', 'pass': p,
        'hint': 'Before calling the handler, check if seen[call["id"]] already has a value. If so, return that cached value directly instead of calling the handler again.',
        'errorMessage': (first.get('errorMessage') if first['threw'] else second.get('errorMessage') if second['threw'] else None)})

    handler_calls3 = [0]
    def inc_handler2(args):
        handler_calls3[0] += 1
        return handler_calls3[0]
    registry = {'inc': {'schema': {'required': []}, 'handler': inc_handler2}}
    seen = {}
    first = safe_call({'id': 'id-a', 'name': 'inc', 'arguments': {}}, registry, seen)
    second = safe_call({'id': 'id-b', 'name': 'inc', 'arguments': {}}, registry, seen)
    p = (not first['threw'] and not second['threw'] and handler_calls3[0] == 2
         and first['out']['result'] != second['out']['result'])
    results.append({'name': 'Different call["id"]s for the same tool execute independently', 'pass': p,
        'hint': 'Your idempotency check must be keyed by call["id"] specifically, not by tool name. Two different IDs calling the same tool should both run the handler.',
        'errorMessage': (first.get('errorMessage') if first['threw'] else second.get('errorMessage') if second['threw'] else None)})

    attempts = [0]
    def flaky_handler(args):
        attempts[0] += 1
        if attempts[0] == 1:
            raise Exception('transient failure')
        return 'recovered'
    registry = {'flaky': {'schema': {'required': []}, 'handler': flaky_handler}}
    seen = {}
    first = safe_call({'id': 'retry1', 'name': 'flaky', 'arguments': {}}, registry, seen)
    second = safe_call({'id': 'retry1', 'name': 'flaky', 'arguments': {}}, registry, seen)
    p = (not first['threw'] and not second['threw'] and first['out']['ok'] is False
         and second['out']['ok'] is True and second['out']['result'] == 'recovered' and attempts[0] == 2)
    results.append({'name': 'A raised error is not cached, so a retry with the same call["id"] gets a real second attempt', 'pass': p,
        'hint': 'Only write to seen[call["id"]] inside the success path, after the handler returns without raising. On except, return the error WITHOUT touching seen, so the next call with the same id calls the handler again.',
        'errorMessage': (first.get('errorMessage') if first['threw'] else second.get('errorMessage') if second['threw'] else None)})

    return {'ranOk': True, 'results': results}
