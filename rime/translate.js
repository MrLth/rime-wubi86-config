/*
 * @Author: mrlthf11
 * @LastEditors: mrlthf11
 * @Date: 2021-02-26 08:25:30
 * @LastEditTime: 2021-02-28 01:17:10
 * @Description: file content
 */
const { readFileSync, readdirSync, writeFileSync } = require('fs')
const wubiDict = require('./wubi-code')

const dictList = readdirSync('./').filter((s) => /^wubi.*\.dict\.yaml$/.test(s))

const dict = dictList.reduce((acc, cur) => acc + readFileSync(`./${cur}`, { encoding: 'utf-8' }), '')


const newDict = readFileSync(`./1.txt`, { encoding: 'utf-8' }).split('\r\n')

const additionDict = new Set()

// 过滤
for (const word of newDict) {
  if (dict.indexOf(`\n${word}\t`) === -1 && word.length < 6) {
    additionDict.add(word)
  }
}

// 转码
/**
 * @param {string} source
 * @return {string}
 */
function translate(source) {
  const codeList = []
  for (const char of source) {
    codeList.push(wubiDict[char])
  }

  try {
    switch (codeList.length) {
      case 1:
        return codeList[0]
      case 2:
        return codeList.map(v => v.substr(0, 2)).join('')
      case 3:
        return codeList.map(v => v.substr(0, 1)).concat(codeList[2].substr(1, 1)).join('')
      case 4:
        return codeList.map(v => v.substr(0, 1)).join('')
      default:
        const last = codeList[codeList.length - 1].substr(-1)
        return codeList.splice(0, 3).map(v => v.substr(0, 1)).concat(last).join('')
    }
  } catch (e) {
    console.log(e)
    console.log(codeList)
  }
}

const outputString = [...additionDict].map(v => `${v}\t${translate(v)}`).join('\r\n')

console.log(outputString);
console.log([...additionDict].length)

writeFileSync('./output.txt', outputString)