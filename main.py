import io
import os

def find_string(string,sub_string):
	return string.find(sub_string)
def formatTextNew(id, text):
    textFm = '    "' + str(id) + '": ' + '"' + text + '"'
    return textFm
def formatString(string):
    temp = string.lstrip()
    if temp[len(temp)-1] == '\n':
        temp = temp[:-1]
    return temp

def formatId(id):
    textFm = '  "' + id + '": {'
    return textFm

def formatStringNew(index, string, file):
    isCheck = False
    isCheckId = True
    id = ''
    text = ''
    for element in range(0, len(string)):
        if string[element] == ':':
            isCheckId = False
        if isCheckId == True:
            id+=string[element]
        if string[element-1] == '"' and element+1 < len(string):
            isCheck = True
        if string[element] == ',' or string[element] == '"':
            isCheck = False
        if isCheck == True:
            text+=string[element]
    idFm = formatString(id)
    if text != '':
        textFm = formatString(text)
        if index == 0:
            file.write(formatId(textFm) + '\n')
        else:
            if index != 0 and index < 2:
                file.write(formatTextNew(idFm, textFm) + ',\n')
            else:
                file.write(formatTextNew(idFm, textFm) + '\n')
    else:
        file.write(formatTextNew(idFm, "") + '\n')

def readFile(reader, fileWrite):
    line = reader.readline()
    # size = os.path.getsize(path)
    while line != '':
        text = find_string(line, 'intl.formatMessage({')
        if text > 0:
            for i in range(3):
                line = reader.readline()
                id = formatStringNew(i, line, fileWrite)
            fileWrite.write("  },\n")
        line = reader.readline()

if __name__ == '__main__':
    fileWrite = io.open('vi.json', 'w', encoding="utf-8")
    fileWrite.write("{\n")
    for root, dirs, files in os.walk('./FolderJs', topdown=False):
        for name in files:
            file = os.path.join(root, name)
            reader = io.open(file, 'r', encoding="utf-8")
            readFile(reader, fileWrite)
            reader.close()
    fileWrite.write("}")
    fileWrite.close()

