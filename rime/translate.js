/*
 * @Author: mrlthf11
 * @LastEditors: mrlthf11
 * @Date: 2021-04-25 09:37:38
 * @LastEditTime: 2021-04-25 15:24:08
 * @Description: 转码
 */
const wubiDict = require('./wubi-code')
const lv1Dict = require('./lv1-simple-code')

/**
 * @param {string} source
 * @return {string|false}
 */
function translate(source) {
  console.log(source)

  const codeList = []
  for (const char of source) {
    if (!wubiDict[char]) {
      return false
    }
    codeList.push(lv1Dict[char] ?? wubiDict[char])
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
    return false
  }
}

module.exports = translate