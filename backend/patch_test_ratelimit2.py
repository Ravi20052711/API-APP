import sys

with open('backend/tests/test_rate_limit.py', 'r') as f:
    content = f.read()

content = "from unittest.mock import patch\n" + content

with open('backend/tests/test_rate_limit.py', 'w') as f:
    f.write(content)
