import io
import os
import uuid

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

list_of_array_with_braces = ['%{"',"%{'","%{`"]
list_of_array_without_braces = ['#{"',"#{'","#{`"]

VALUE_WITH_BRACES = True
VALUE_WITHOUT_BRACES = False

VALUE_MIN_FORMAT = 3

BRACE = '{'
BRACE_CLOSE = '}'
VALUE_PARAM_DEFINE = "{param}"

ARRAY_EXCEPT_STRING = ['.tsx','./src\\']

MAX_UUID_LENGTH = 5

def find_string_format(line):
    hasBraces = None
    for dataWithBrace in list_of_array_with_braces:
        hasData = find_string(line,dataWithBrace)
        if hasData != -1:
            hasBraces = VALUE_WITH_BRACES
            break
    if hasBraces == None:
        for dataWithoutBrace in list_of_array_without_braces:
            hasDataWithoutBrace = find_string(line,dataWithoutBrace)
            if hasDataWithoutBrace != -1:
                hasBraces = VALUE_WITHOUT_BRACES
                break
    return hasBraces

def getTextValueAndParams(line):
    hasValue = False
    arrValueParam = []
    indexStart = 0
    textValue = ""
    for element in range(VALUE_MIN_FORMAT, len(line)-2):
        if line[element] == BRACE:
            hasValue = True
            indexStart = element
        if line[element] != BRACE and hasValue == False:
            textValue += line[element]
        if hasValue == True and line[element] == BRACE_CLOSE:
            hasValue = False
            string_slice = line[indexStart+1:element]
            arrValueParam.append(string_slice)
            textValue += VALUE_PARAM_DEFINE
    return [textValue, arrValueParam]

def getFilePathFormatted(filePath):
    newFilePath = filePath
    for element in ARRAY_EXCEPT_STRING:
        newFilePath = newFilePath.replace(element, '')
    return newFilePath.replace('\\',"-")

def getId(filePath):
    filePathFormatted = getFilePathFormatted(filePath)
    idRandom = str(uuid.uuid4())[:MAX_UUID_LENGTH]
    return filePathFormatted + "-" + idRandom

def readFile(reader, id):
    line = reader.readline()
    while line != '':
        typeBraces = find_string_format(line)
        if typeBraces != None:
            data = getTextValueAndParams(line)
            textValue = data[0]
            arrValueParam = data[1]
            print(id)
            print(textValue)
            print(arrValueParam)
            print('------')
        line = reader.readline()

if __name__ == '__main__':
    for root, dirs, files in os.walk('./src', topdown=False):
        for name in files:
            file = os.path.join(root, name)
            id = getId(file)
            reader = io.open(file, 'r', encoding="utf-8")
            readFile(reader,id)
            reader.close()

