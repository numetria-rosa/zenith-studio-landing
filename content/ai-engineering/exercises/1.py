def harness(student_code):
    ns = {}
    try:
        exec(student_code, ns)
        fn = ns.get('extract_structured_output')
        if fn is None or not callable(fn):
            return {'ranOk': False, 'error': 'extract_structured_output is not defined as a function.'}
    except Exception as e:
        return {'ranOk': False, 'error': str(e)}

    def safe_call(raw_text, schema):
        try:
            return {'threw': False, 'out': fn(raw_text, schema)}
        except Exception as e:
            return {'threw': True, 'out': None, 'errorMessage': str(e)}

    results = []

    r = safe_call('{"name":"Alice","age":30}', {'required': ['name', 'age']})
    p = (not r['threw'] and isinstance(r['out'], dict) and r['out'].get('ok') is True
         and isinstance(r['out'].get('data'), dict) and r['out']['data'].get('name') == 'Alice' and r['out']['data'].get('age') == 30)
    results.append({'name': 'Clean JSON parses correctly', 'pass': p,
        'hint': 'A well-formed JSON string matching the schema should return {"ok": True, "data": ...} with the parsed values intact.',
        'errorMessage': r.get('errorMessage') if r['threw'] else None})

    r = safe_call('```json\n{"name":"Priya"}\n```', {'required': ['name']})
    p = (not r['threw'] and isinstance(r['out'], dict) and r['out'].get('ok') is True
         and isinstance(r['out'].get('data'), dict) and r['out']['data'].get('name') == 'Priya')
    results.append({'name': 'Markdown code fence is stripped before parsing', 'pass': p,
        'hint': 'Strip a leading/trailing ``` (optionally ```json) fence before attempting json.loads.',
        'errorMessage': r.get('errorMessage') if r['threw'] else None})

    r = safe_call('{"name":"Alex","age":35,}', {'required': ['name', 'age']})
    p = (not r['threw'] and isinstance(r['out'], dict) and r['out'].get('ok') is True
         and isinstance(r['out'].get('data'), dict) and r['out']['data'].get('age') == 35)
    results.append({'name': 'Trailing comma is repaired before parsing', 'pass': p,
        'hint': 'Replace a comma immediately before a closing } or ] with nothing before parsing.',
        'errorMessage': r.get('errorMessage') if r['threw'] else None})

    r = safe_call('{"name":"Sam"}', {'required': ['name', 'age']})
    p = (not r['threw'] and isinstance(r['out'], dict) and r['out'].get('ok') is False
         and isinstance(r['out'].get('error'), str) and 'age' in r['out']['error'].lower())
    results.append({'name': 'Missing required field is rejected with a specific error', 'pass': p,
        'hint': 'After parsing, check every field in schema["required"] is present, and name the missing one in the error.',
        'errorMessage': r.get('errorMessage') if r['threw'] else None})

    r = safe_call("I'm not able to help with that request.", {'required': ['name']})
    p = (not r['threw'] and isinstance(r['out'], dict) and r['out'].get('ok') is False
         and isinstance(r['out'].get('error'), str))
    results.append({'name': 'Non-JSON prose is rejected gracefully, not raised', 'pass': p,
        'hint': 'Wrap json.loads in try/except, plain prose will raise json.JSONDecodeError, catch it and return {"ok": False, "error": ...}.',
        'errorMessage': r.get('errorMessage') if r['threw'] else None})

    return {'ranOk': True, 'results': results}
