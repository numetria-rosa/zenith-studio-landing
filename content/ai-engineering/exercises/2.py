def harness(student_code):
    ns = {}
    try:
        exec(student_code, ns)
        fn = ns.get('chunk_text')
        if fn is None or not callable(fn):
            return {'ranOk': False, 'error': 'chunk_text is not defined as a function.'}
    except Exception as e:
        return {'ranOk': False, 'error': str(e)}

    def safe_call(words, max_tokens, overlap, estimator):
        try:
            return {'threw': False, 'out': fn(words, max_tokens, overlap, estimator)}
        except Exception as e:
            return {'threw': True, 'out': None, 'errorMessage': str(e)}

    def one_token_per_word(w):
        return 1

    results = []

    words = ['a', 'b', 'c', 'd', 'e']
    r = safe_call(words, 100, 1, one_token_per_word)
    p = (not r['threw'] and isinstance(r['out'], list) and len(r['out']) == 1 and r['out'][0] == words)
    results.append({'name': 'Generous budget produces a single chunk with everything', 'pass': p,
        'hint': 'If the whole input fits under max_tokens_per_chunk, you should end up with exactly one chunk containing all the words.',
        'errorMessage': r.get('errorMessage') if r['threw'] else None})

    words = ['one', 'two', 'three', 'four', 'five', 'six']
    r = safe_call(words, 3, 1, one_token_per_word)
    p = not r['threw'] and isinstance(r['out'], list) and len(r['out']) >= 2
    if p:
        out = r['out']
        for i in range(len(out) - 1):
            cur, nxt = out[i], out[i + 1]
            if len(cur) == 0 or len(nxt) == 0 or cur[-1] != nxt[0]:
                p = False
                break
        if p:
            for c in out:
                if sum(one_token_per_word(w) for w in c) > 3:
                    p = False
    results.append({'name': 'Multi-chunk split respects the token budget and overlaps correctly', 'pass': p,
        'hint': "With max_tokens_per_chunk=3 and 1 token/word, each chunk should hold at most 3 words, and each chunk's last word should equal the next chunk's first word (overlap_words=1).",
        'errorMessage': r.get('errorMessage') if r['threw'] else None})

    words = ['averylongsingleword']
    r = safe_call(words, 1, 0, lambda w: 999)
    p = (not r['threw'] and isinstance(r['out'], list) and len(r['out']) == 1
         and r['out'][0] == ['averylongsingleword'])
    results.append({'name': 'A single word exceeding the budget alone still gets its own chunk', 'pass': p,
        'hint': 'Never drop content. If a chunk is still empty, add the word even if it alone exceeds max_tokens_per_chunk, that is the only way to guarantee no word is silently lost.',
        'errorMessage': r.get('errorMessage') if r['threw'] else None})

    words = ['w' + str(i) for i in range(20)]
    r = safe_call(words, 4, 1, one_token_per_word)
    p = not r['threw'] and isinstance(r['out'], list) and len(r['out']) > 1
    if p:
        seen = set()
        for c in r['out']:
            seen.update(c)
        p = all(w in seen for w in words)
    results.append({'name': 'Every word appears in at least one chunk (nothing silently dropped)', 'pass': p,
        "hint": "Walk through your loop's termination condition carefully, a longer input is where an off-by-one in the overlap math tends to drop the last few words.",
        'errorMessage': r.get('errorMessage') if r['threw'] else None})

    words = ['w1', 'w2', 'w3', 'w4', 'w5', 'w6']
    r = safe_call(words, 3, 0, one_token_per_word)
    p = (not r['threw'] and isinstance(r['out'], list) and len(r['out']) == 2
         and r['out'][0] == ['w1', 'w2', 'w3'] and r['out'][1] == ['w4', 'w5', 'w6'])
    results.append({'name': 'Zero overlap produces a clean, non-repeating partition', 'pass': p,
        'hint': "With overlap_words=0, chunk boundaries shouldn't repeat any word, [w1,w2,w3] then [w4,w5,w6], nothing shared between them.",
        'errorMessage': r.get('errorMessage') if r['threw'] else None})

    return {'ranOk': True, 'results': results}
