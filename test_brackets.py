import re

def strip_comments_strings(text):
    # This is a highly simplified regex and will break on some valid TSX, but good enough for rough check.
    text = re.sub(r'//.*', '', text)
    text = re.sub(r'/\*.*?\*/', '', text, flags=re.DOTALL)
    # text = re.sub(r'".*?"', '""', text)
    # text = re.sub(r"'.*?'", "''", text)
    # text = re.sub(r'`.*?`', '``', text, flags=re.DOTALL)
    return text

with open('src/features/chat/components/TripChat.tsx', 'r') as f:
    text = f.read()

text = strip_comments_strings(text)

def check_brackets(text):
    stack = []
    lines = text.split('\n')

    row = 1
    col = 0
    for char in text:
        if char == '\n':
            row += 1
            col = 0
            continue
        col += 1

        if char in '{[(':
            stack.append((char, row, col))
        elif char in '}])':
            if not stack:
                print(f"Unmatched closing '{char}' at line {row}, col {col}")
                return
            top_char, top_row, top_col = stack.pop()
            brackets = {'{': '}', '[': ']', '(': ')'}
            if brackets[top_char] != char:
                print(f"Mismatched closing '{char}' at line {row}, col {col}. Expected '{brackets[top_char]}' to match opening '{top_char}' at line {top_row}, col {top_col}")
                return

    if stack:
        print(f"Unclosed brackets remaining: {len(stack)}")
        for b, r, c in stack[-5:]:
            print(f"Unclosed '{b}' at line {r}, col {c}")
    else:
        print("Brackets match!")

check_brackets(text)
