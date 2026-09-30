def harness(student_code):
    ns = {}
    try:
        exec(student_code, ns)
        fn = ns.get('strip_code_fence')
        if fn is None or not callable(fn):
            return {'ranOk': False, 'error': 'strip_code_fence is not defined as a function.'}
    except Exception as e:
        return {'ranOk': False, 'error': str(e)}
    def safe_call(text):
        try:
            return {'threw': False, 'out': fn(text)}
        except Exception as e:
            return {'threw': True, 'out': None, 'errorMessage': str(e)}
    results = []
    cases = [
        ('```json\n{"a": 1}\n```', '{"a": 1}'),
        ('```\nhello\n```', 'hello'),
        ('no fence here', 'no fence here'),
        ('  \n  plain text  \n  ', 'plain text'),
        ('```python\nline1\nline2\n```', 'line1\nline2'),
    ]
    for text, expected in cases:
        r = safe_call(text)
        p = not r['threw'] and r['out'] == expected
        results.append({'name': 'strip_code_fence handles: ' + repr(text)[:40], 'pass': p,
            'hint': 'Match a leading and trailing ``` (with optional language tag) and return the captured inner content; otherwise return text.strip().',
            'errorMessage': r.get('errorMessage') if r['threw'] else None})
    return {'ranOk': True, 'results': results}
