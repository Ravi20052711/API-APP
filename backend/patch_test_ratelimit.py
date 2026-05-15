import sys

with open('backend/tests/test_rate_limit.py', 'r') as f:
    content = f.read()

content = content.replace('''def test_rate_limiting():''', '''@patch('app.middleware.rate_limit.SessionLocal')
def test_rate_limiting(mock_session_local):
    mock_session_local.return_value = TestingSessionLocal()
''')

with open('backend/tests/test_rate_limit.py', 'w') as f:
    f.write(content)
