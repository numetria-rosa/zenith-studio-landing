async def harness(student_code):
    def cosine_similarity(a, b):
        dot = sum(a[i]*b[i] for i in range(len(a)))
        na = sum(x*x for x in a) ** 0.5
        nb = sum(x*x for x in b) ** 0.5
        if na == 0 or nb == 0:
            return 0
        return dot / (na * nb)

    ns = {}
    try:
        exec(student_code, ns)
        fn = ns.get('handle_support_request')
        if fn is None or not callable(fn):
            return {'ranOk': False, 'error': 'handle_support_request is not defined as a function.'}
    except Exception as e:
        return {'ranOk': False, 'error': str(e)}

    results = []

    ticket_calls = [0]
    kb = [{'id': 'doc1', 'vector': [0, 1]}, {'id': 'doc2', 'vector': [0.1, 0.99]}]
    async def ticket_tool1(args):
        ticket_calls[0] += 1
        return 'ticket_1'
    out = err = None
    try:
        out = await fn({'queryVector': [1, 0], 'callId': 'c1', 'ticketArgs': {}}, kb, ticket_tool1, {})
    except Exception as e:
        err = e
    p = not err and out and out['ok'] is True and out['source'] == 'none' and ticket_calls[0] == 0
    results.append({'name': "Below-threshold match returns 'none' without calling the ticket tool", 'pass': p,
        "hint": "Find the best cosine-similarity score across kb. If it's below 0.4, return {'ok': True, 'source': 'none', 'reason': ...} immediately, never call ticket_tool.",
        'errorMessage': str(err) if err else None})

    ticket_calls2 = [0]
    kb2 = [{'id': 'irrelevant', 'vector': [0, 1]}, {'id': 'relevant', 'vector': [1, 0]}]
    async def ticket_tool2(args):
        ticket_calls2[0] += 1
        return 'ticket_2'
    out = err = None
    try:
        out = await fn({'queryVector': [1, 0], 'callId': 'c2', 'ticketArgs': {}}, kb2, ticket_tool2, {})
    except Exception as e:
        err = e
    p = (not err and out and out['ok'] is True and out['source'] == 'kb' and out['docId'] == 'relevant'
         and out['ticket'] == 'ticket_2' and ticket_calls2[0] == 1)
    results.append({'name': 'A relevant match calls the ticket tool once and returns its result with the correct docId', 'pass': p,
        "hint": "When the best score is >= 0.4, call ticket_tool(input['ticketArgs']) and return {'ok': True, 'source': 'kb', 'docId': <best match id>, 'ticket': <result>}.",
        'errorMessage': str(err) if err else None})

    ticket_calls3 = [0]
    kb3 = [{'id': 'relevant', 'vector': [1, 0]}]
    async def ticket_tool3(args):
        ticket_calls3[0] += 1
        return 'ticket_' + str(ticket_calls3[0])
    seen = {}
    out1 = out2 = err = None
    try:
        out1 = await fn({'queryVector': [1, 0], 'callId': 'dup1', 'ticketArgs': {}}, kb3, ticket_tool3, seen)
        out2 = await fn({'queryVector': [1, 0], 'callId': 'dup1', 'ticketArgs': {}}, kb3, ticket_tool3, seen)
    except Exception as e:
        err = e
    p = not err and ticket_calls3[0] == 1 and out1['ticket'] == out2['ticket']
    results.append({'name': 'The same callId is not re-executed against the ticket tool (idempotency)', 'pass': p,
        "hint": "Before calling ticket_tool, check if seen[input['callId']] already has a value. If so, return it directly instead of calling the tool again.",
        'errorMessage': str(err) if err else None})

    ticket_calls4 = [0]
    kb4 = [{'id': 'relevant', 'vector': [1, 0]}]
    async def ticket_tool4(args):
        ticket_calls4[0] += 1
        return 'ticket_' + str(ticket_calls4[0])
    seen4 = {}
    err = None
    try:
        await fn({'queryVector': [1, 0], 'callId': 'id-a', 'ticketArgs': {}}, kb4, ticket_tool4, seen4)
        await fn({'queryVector': [1, 0], 'callId': 'id-b', 'ticketArgs': {}}, kb4, ticket_tool4, seen4)
    except Exception as e:
        err = e
    p = not err and ticket_calls4[0] == 2
    results.append({'name': 'Different callIds for relevant matches execute independently', 'pass': p,
        "hint": "Your idempotency check must be keyed by input['callId'] specifically. Two different callIds should both result in a ticket_tool call.",
        'errorMessage': str(err) if err else None})

    attempts = [0]
    kb5 = [{'id': 'relevant', 'vector': [1, 0]}]
    async def ticket_tool5(args):
        attempts[0] += 1
        if attempts[0] == 1:
            raise Exception('ticket service down')
        return 'ticket_recovered'
    seen5 = {}
    out1 = out2 = err = None
    try:
        out1 = await fn({'queryVector': [1, 0], 'callId': 'retry1', 'ticketArgs': {}}, kb5, ticket_tool5, seen5)
        out2 = await fn({'queryVector': [1, 0], 'callId': 'retry1', 'ticketArgs': {}}, kb5, ticket_tool5, seen5)
    except Exception as e:
        err = e
    p = (not err and out1['ok'] is False and isinstance(out1.get('error'), str)
         and out2['ok'] is True and out2['ticket'] == 'ticket_recovered' and attempts[0] == 2)
    results.append({'name': 'A ticket_tool that raises returns a structured failure and is NOT cached, so a retry with the same callId gets a real second attempt', 'pass': p,
        "hint": "Wrap the ticket_tool call in try/except. On failure, return {'ok': False, ...} WITHOUT writing to seen, so the next call with the same callId calls the tool again.",
        'errorMessage': str(err) if err else None})

    kb6 = [
        {'id': 'medium', 'vector': [0.8, 0.6]},
        {'id': 'best', 'vector': [1, 0]},
        {'id': 'low_but_above', 'vector': [0.5, 0.87]},
    ]
    async def ticket_tool6(args):
        return 'ticket_x'
    out = err = None
    try:
        out = await fn({'queryVector': [1, 0], 'callId': 'c6', 'ticketArgs': {}}, kb6, ticket_tool6, {})
    except Exception as e:
        err = e
    p = not err and out and out['docId'] == 'best'
    results.append({'name': 'Picks the highest-scoring doc when multiple candidates clear the relevance threshold', 'pass': p,
        'hint': "Compare EVERY document's score and track the maximum, don't just take the first one that clears 0.4, keep checking the rest for a better match.",
        'errorMessage': str(err) if err else None})

    return {'ranOk': True, 'results': results}
