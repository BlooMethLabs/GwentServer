from HTMLParser import HTMLParser

class MyHTMLParser(HTMLParser):

    def handle_starttag(self, tag, attrs):
        if tag != 'img':
            return
        for name, value in attrs:
            if name == 'alt':
                if value == "Tw3 gwent close combat.png":
                    print "close"
                if value == "Tw3 gwent close-ranged.png":
                    print "ranged"
                if value == "Tw3 gwent siege.png":
                    print "siege"
                if value == "Tw3 gwent close-ranged.png":
                    print "agile"

    def handle_data(self, data):
        print data

f = open("Monsters.html")
parser = MyHTMLParser()
html = f.read()
parser.feed(html)