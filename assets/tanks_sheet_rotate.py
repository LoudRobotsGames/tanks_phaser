# Extract sprite coordinates from rotated
# Kenney spritesheet
import xml.etree.ElementTree as ET

datafile = 'onlyObjects_default.xml'
imagefile = 'onlyObjects_default.png'
sheet_width = 395
sheet_height = 387

# parse Kenney XML file
tree = ET.parse(datafile)
rects = {}
for node in tree.iter():
    if node.attrib.get('name'):
        name = node.attrib.get('name').replace('.png', '')
        rects[name] = []
        rects[name].append(int(node.attrib.get('x')))
        rects[name].append(int(node.attrib.get('y')))
        rects[name].append(int(node.attrib.get('width')))
        rects[name].append(int(node.attrib.get('height')))
print("<TextureAtlas imagePath=\"%s\">" %(imagefile))

for name, rect in rects.items():
    x, y, w, h = rect
    x, y = y, x
    w, h = h, w
    y = sheet_height - y - h
    print("\t<SubTexture name=\"%s.png\" x=\"%d\" y=\"%d\" width=\"%d\" height=\"%d\"/>" % (name, x, y, w, h))
print("</TextureAtlas>")
