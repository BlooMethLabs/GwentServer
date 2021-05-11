import json
f = open("Monsters.parsed")
deck = []
# card = {"Name": "N"}
card = {}
# jsonCard = json.dumps(card, sort_keys=True)
nameNext = False
for line in f:
    if nameNext:
        card["Name"] = line
        nameNext = False
        continue
    if line.startswith("Name"):
        card["Faction"] = "Monsters"
        if "Hero" not in card and "Type" in card and card["Type"] == "Unit":
            card["Hero"] = False
        if "Name" in card:
            deck.append(card)
        card = {}
        nameNext = True
        continue
    if line.startswith("Leader"):
        card["Type"] = "Leader"
        continue
    if line.startswith("Unit"):
        card["Type"] = "Unit"
        continue
    if line[0].isdigit():
        card["Strength"] = int(line.split()[0])
        continue
    if line.startswith("Muster") or line.startswith("Scorch") or line.startswith("Spy"):
        if "UnitAbilities" not in card:
            card["UnitAbilities"] = []
        card["UnitAbilities"].append(line.split()[0])
        continue
    if line.startswith("Close") or line.startswith("Ranged") or line.startswith("Siege") or line.startswith("Agile"):
        card["Range"] = line.split()[0]
        continue
    if line.startswith("Hero"):
        card["Hero"] = True
        continue

print json.dumps(deck, sort_keys=True, indent=4)


