import json

locales = ["en", "cz", "et", "lt", "zh"]
filename = "art-pieces.json"

for locale in locales:
    with open(f"public/locales/{locale}/{filename}", "r") as f:    
      json_array = json.load(f)

      # Initialize an empty dictionary to store the resulting JSON object
      json_object = {}

      # Loop through the JSON array and convert it to a JSON object
      for item in json_array:
          key = item["art_id"]  # Choose the property you want to use as the key
          del item["art_id"]
          json_object[key] = item
      
      # Write the JSON object to a file
      with open(f"public/locales/{locale}/{filename}", "w") as f:
          json.dump(json_object, f, indent=4)

print("Done!")