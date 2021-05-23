import io
import os

def find_string(string,sub_string):
	return string.find(sub_string)
id = 0
def formatText(text):
    global id
    textFm = '  "' + str(id) + '": ' + '"' + text + '"'
    id = id + 1
    return textFm
def formatString(string):
    temp = string.lstrip()
    if temp[len(temp)-1] == '\n':
        temp = temp[:-1]
    return temp
def analyzeText(string, file):
    isCheck = False
    text = ''
    global textAll
    for element in range(0, len(string)):
        if isCheck == False and string[element-1] == '>' and element+1 < len(string):
            isCheck = True
        if string[element] == '<':
            isCheck = False
        if isCheck == True:
            text+=string[element]
    if text != '':
        textFm = formatString(text)
        file.write(formatText(textFm) + '\n')
    if find_string(string, '</Text>') < 0:
        return 1
    return 0

def readFile(reader, fileWrite):
    line = reader.readline()
    while line != '':
        text = find_string(line, '<Text ')
        if text > 0:
            if analyzeText(line, fileWrite) == 1:
                line = reader.readline()
                textFm = formatString(line)
                if textFm[0] != '{':
                    fileWrite.write(formatText(textFm) + '\n')
        line = reader.readline()

if __name__ == '__main__':
    fileWrite = io.open('testfile.txt', 'w', encoding="utf-8")
    fileWrite.write("{\n")
    for root, dirs, files in os.walk('./FolderJs', topdown=False):
        for name in files:
            file = os.path.join(root, name)
            reader = io.open(file, 'r', encoding="utf-8")
            readFile(reader, fileWrite)
            reader.close()
    fileWrite.write("}")
    fileWrite.close()

