import requests

url = "http://localhost:8000/api/v1/auth/login"
payload = {"email": "ravi@example.com", "password": "Ravi23345"}
response = requests.post(url, json=payload)
token = response.json()["access_token"]

headers = {"Authorization": f"Bearer {token}"}

url = "http://localhost:8000/api/v1/admin/users"
response = requests.get(url, headers=headers)
print("Users:", response.status_code)

url = "http://localhost:8000/api/v1/admin/api-keys"
response = requests.get(url, headers=headers)
print("API Keys:", response.status_code)
