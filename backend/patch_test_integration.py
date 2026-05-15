import sys

with open('backend/tests/test_integration.py', 'r') as f:
    content = f.read()

# Make sure tests drop all and then create all tables properly
content = content.replace('''@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    PaymentBase.metadata.create_all(bind=p_engine)
    yield
    Base.metadata.drop_all(bind=engine)
    PaymentBase.metadata.drop_all(bind=p_engine)''', '''@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    PaymentBase.metadata.create_all(bind=p_engine)
    yield
    Base.metadata.drop_all(bind=engine)
    PaymentBase.metadata.drop_all(bind=p_engine)''')

with open('backend/tests/test_integration.py', 'w') as f:
    f.write(content)
