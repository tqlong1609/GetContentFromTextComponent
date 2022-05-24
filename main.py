import io
import os, shutil
import uuid
from time import sleep
from tqdm import tqdm
from googletrans import Translator
translator = Translator()

list_of_array_with_braces = ['%{"',"%{'","%{`"]
list_of_array_without_braces = ['#{"',"#{'","#{`"]

VALUE_WITH_BRACES = True
VALUE_WITHOUT_BRACES = False

VALUE_MIN_FORMAT = 3

BRACE = '{'
BRACE_CLOSE = '}'
VALUE_PARAM_DEFINE = "param"

ARRAY_EXCEPT_STRING = ['.tsx','./src\\','.js','.test']

TAB_SPACE = "\t\t\t\t\t"

MAX_UUID_LENGTH = 5

LANGUAGE_ORIGIN = 'vi'

PATH_OUTPUT = "./output/"

def find_string(string,sub_string):
	return string.find(sub_string)

def formatJsonString(id, _defaultMessage):
    defaultMessage = _defaultMessage.replace('$','')
    return "\t\"{id}\": ".format(id=id) + "\"{defaultMessage}\",\n".format(defaultMessage=_defaultMessage)

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

def getTextValueAndParams(_line):
    line = _line.strip()
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
            textValue += "{" + VALUE_PARAM_DEFINE + str(len(arrValueParam)) + "}"
    return [textValue, arrValueParam]

def getFilePathFormatted(filePath):
    newFilePath = filePath
    for element in ARRAY_EXCEPT_STRING:
        newFilePath = newFilePath.replace(element, '')
    return newFilePath.replace('\\',"-")

def getTextFormat (id, defaultMessage, arrParams):
    data = TAB_SPACE + "intl.formatMessage({\n" + TAB_SPACE + "id: \"{id}\",\n".format(id=id) + TAB_SPACE + "defaultMessage: \"{defaultMessage}\",\n".format(defaultMessage=defaultMessage) + TAB_SPACE + "description: \"\"\n" + TAB_SPACE + "}"
    dataParam = ""
    if len(arrParams) > 0:
        for idx, param in enumerate(arrParams):
            dataParam += ",\n" + TAB_SPACE + "{\n" + TAB_SPACE + "param{index}".format(index = idx + 1) + ": {param}\n".format(param=param) + TAB_SPACE + "}"
    return data + dataParam + ")"

def getFolderPath (file, nameFile):
    newFolderPath = file
    newFolderPath = newFolderPath.replace(nameFile,'')
    for element in ARRAY_EXCEPT_STRING:
        newFolderPath = newFolderPath.replace(element, '')
    newFolderPath = newFolderPath.replace('\\',"/")
    if newFolderPath == "":
        return PATH_OUTPUT
    else:
        return PATH_OUTPUT + newFolderPath

def generateFolder(folderPath):
    if folderPath != PATH_OUTPUT and os.path.exists(folderPath) == False:
        os.makedirs(folderPath)

def resetFolder(dir):
    for files in os.listdir(dir):
        path = os.path.join(dir, files)
        try:
            shutil.rmtree(path)
        except OSError:
            os.remove(path)
            
def readFile(file, reader, nameFile, fileWriteJsonEn, fileWriteJsonVi):
    filePathFormatted = getFilePathFormatted(file)

    line = reader.readline()
    
    textContent = ""
    isReader = False
    while line != '':
        typeBraces = find_string_format(line)
        if typeBraces != None:
            isReader = True
            data = getTextValueAndParams(line)
            idRandom = str(uuid.uuid4())[:MAX_UUID_LENGTH]
            id = filePathFormatted + "-" + idRandom
            textFormat = getTextFormat(id, data[0], data[1])

            # write output
            if typeBraces == VALUE_WITH_BRACES:
                textContent = textContent + TAB_SPACE + "{\n"
                textContent = textContent + textFormat + "\n"
                textContent = textContent + TAB_SPACE + "}\n"
            else:
                textContent = textContent + textFormat + "\n"
            
            # write en.json file
            stringJsonFormatEn = formatJsonString(id, data[0])
            fileWriteJsonEn.write(stringJsonFormatEn)

            # write vi.json file
            textVi = translator.translate(data[0], dest=LANGUAGE_ORIGIN).text
            stringJsonFormatVi = formatJsonString(id, textVi)
            fileWriteJsonVi.write(stringJsonFormatVi)
        else:
            textContent = textContent + line
        line = reader.readline()

    if isReader == True:
        folderPath = getFolderPath(file, nameFile)
        generateFolder(folderPath)
        readerWrite = io.open(folderPath + nameFile, 'w', encoding="utf-8")
        readerWrite.write(textContent)
        readerWrite.close()

if __name__ == '__main__':
    resetFolder('./output')

    fileWriteJsonEn = io.open('en.json', 'w', encoding="utf-8")
    fileWriteJsonVi = io.open('vi.json', 'w', encoding="utf-8")
    fileWriteJsonEn.write("{\n")
    fileWriteJsonVi.write("{\n")

    for root, dirs, files in os.walk('./src', topdown=False):
        for name in tqdm(files):
            file = os.path.join(root, name)
            reader = io.open(file, 'r', encoding="utf-8")
            readFile(file, reader, name, fileWriteJsonEn, fileWriteJsonVi)
            reader.close()

    fileWriteJsonEn.write("}")
    fileWriteJsonVi.write("}")
    fileWriteJsonEn.close()
    fileWriteJsonVi.close()

