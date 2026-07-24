import re
import os
import requests

# Find all api.get/post/put/delete in frontend
frontend_dir = "../frontend/src/services"
routes = set()

for filename in os.listdir(frontend_dir):
    if filename.endswith(".js"):
        with open(os.path.join(frontend_dir, filename), "r") as f:
            content = f.read()
            # find all api.<method>('/path' or `/path...`)
            matches = re.findall(r"api\.(?:get|post|put|delete)\(['`\"](.*?)['`\"]", content)
            for match in matches:
                # clean up interpolations like ${id}
                cleaned = re.sub(r'\$\{.*?\}', '1', match)
                routes.add(cleaned)

print("Testing routes against localhost:8000...")
for route in sorted(routes):
    url = f"http://localhost:8000{route}"
    # Just do a GET for testing existence (methods might not match, but 405 means route exists)
    try:
        res = requests.get(url)
        print(f"{res.status_code} {route}")
    except Exception as e:
        print(f"ERROR {route}: {e}")
