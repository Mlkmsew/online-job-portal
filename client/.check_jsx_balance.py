from pathlib import Path
import re
import sys
path = Path('src/pages/dashboard/jobseeker/ResumeBuilder.jsx')
text = path.read_text(encoding='utf8')
# Minimal lexer ignoring strings/comments for braces, parentheses, and angle tags.
brace_stack = []
line = 1
col = 0
state = 'normal'
quote = ''
escaped = False
for ch in text:
    col += 1
    if ch == '\n':
        line += 1
        col = 0
        continue
    if state == 'normal':
        if ch in '"\'':
            state = 'string'
            quote = ch
            escaped = False
        elif ch == '/' and text[text.index(ch):].startswith('//'):
            state = 'line_comment'
        elif ch == '/' and text[text.index(ch):].startswith('/*'):
            state = 'block_comment'
        elif ch == '{':
            brace_stack.append((line, col, '{'))
        elif ch == '}':
            if not brace_stack or brace_stack[-1][2] != '{':
                print('Unmatched } at', line, col)
                sys.exit(1)
            brace_stack.pop()
    elif state == 'string':
        if escaped:
            escaped = False
        elif ch == '\\':
            escaped = True
        elif ch == quote:
            state = 'normal'
    elif state == 'line_comment':
        if ch == '\n':
            state = 'normal'
    elif state == 'block_comment':
        if ch == '*' and text[text.index(ch):].startswith('*/'):
            state = 'normal'
print('done', len(brace_stack), brace_stack[-5:])
