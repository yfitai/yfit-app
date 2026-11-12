#!/usr/bin/env python3
"""Mocked end-work tests: no network, real commits, or credential storage."""
import os
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / 'end-work.sh'
GIT_MOCK = r'''#!/usr/bin/python3
import os, sys
from pathlib import Path
args = sys.argv[1:]
while args[:1] == ['-c']:
    args = args[2:]
folder = ''
if args[:1] == ['-C']:
    folder, args = args[1], args[2:]
repo = {'yfit-app-full':'yfit-app', 'yfit-marketing':'yfit-admin', 'yfit-ai':'yfit-ai', 'yfit-video-service':'yfitai-yfit-video-service'}.get(Path(folder).name, '')
scenario = os.environ['SCENARIO']
with open(os.environ['MOCK_LOG'], 'a') as f:
    f.write('git ' + ' '.join(args) + '\n')
cmd = args[0]
if cmd == 'branch':
    print('feature' if scenario == 'wrong-branch' else 'main')
elif cmd == 'remote' and args[1] == 'get-url':
    if repo == 'yfit-admin':
        sys.exit(2)
    print('https://github.com/yfitai/' + ('wrong-repo' if scenario == 'wrong-remote' else repo) + '.git')
elif cmd == 'status':
    if scenario in ('secret', 'dirty-success') and repo == 'yfit-app' and not Path(os.environ['MOCK_COMMITTED']).exists():
        print(' M session-note.md')
elif cmd == 'diff':
    if '--cached' in args and '--quiet' not in args and '--check' not in args:
        print('+' + ('ghp_' + 'X' * 36 if scenario == 'secret' else 'Safe session note'))
    elif '--cached' in args and '--quiet' in args and scenario == 'dirty-success':
        sys.exit(1)
elif cmd == 'commit':
    Path(os.environ['MOCK_COMMITTED']).touch()
elif cmd == 'push':
    if scenario == 'push-failure':
        sys.exit(1)
elif cmd == 'rev-parse':
    print('a' * (7 if '--short' in args else 40))
elif cmd == 'ls-remote':
    print(('b' if scenario == 'hash-mismatch' else 'a') * 40 + '\trefs/heads/main')
'''
GH_MOCK = '''#!/bin/sh
printf 'gh %s\\n' "$*" >> "$MOCK_LOG"
if [ "$SCENARIO" = "auth-failure" ]; then exit 1; fi
printf '{}\\n'
'''

cases = [
    ('success', True),
    ('dirty-success', True),
    ('auth-failure', False),
    ('wrong-branch', False),
    ('wrong-remote', False),
    ('secret', False),
    ('push-failure', False),
    ('hash-mismatch', False),
]
for scenario, expect_success in cases:
    with tempfile.TemporaryDirectory(prefix='yfit-workflow-test-') as temp:
        tmp = Path(temp)
        for name, code in [('git', GIT_MOCK), ('gh', GH_MOCK)]:
            p = tmp / name
            p.write_text(code)
            p.chmod(0o755)
        env = dict(os.environ)
        env.update(PATH=str(tmp) + ':/usr/local/bin:/usr/bin:/bin', HOME=str(tmp),
                   MANUS_CONFIG_HOME=str(tmp / 'nonexistent'), SCENARIO=scenario,
                   MOCK_LOG=str(tmp / 'calls.log'), MOCK_COMMITTED=str(tmp / 'committed'))
        result = subprocess.run(['bash', str(SCRIPT)], env=env, capture_output=True, text=True, timeout=30)
        success = result.returncode == 0
        assert success == expect_success, f'{scenario}: unexpected exit {result.returncode}'
        assert ('End-work complete:' in result.stdout) == expect_success, f'{scenario}: incorrect success claim'
        log = (tmp / 'calls.log').read_text() if (tmp / 'calls.log').exists() else ''
        assert 'config --global' not in log, f'{scenario}: global Git mutation'
        assert not (tmp / '.yfit-credentials').exists(), f'{scenario}: legacy credential file'
        assert not (tmp / '.git-credentials').exists(), f'{scenario}: plaintext credential file'
        if scenario in ('auth-failure', 'wrong-branch', 'wrong-remote', 'secret'):
            assert 'git push' not in log, f'{scenario}: unsafe push'
        if scenario == 'dirty-success':
            assert 'git commit' in log, 'Dirty work was not committed'
        print('PASS:', scenario)
print('All 8 mocked workflow tests passed; no real external writes were performed.')
