/*
 * @Author: mrlthf11
 * @LastEditors: mrlthf11
 * @Date: 2021-04-25 09:47:50
 * @LastEditTime: 2021-04-25 15:12:19
 * @Description: rime 词库读取
 */

const { readFileSync, readdirSync } = require('fs')
const path = require('path')

const dictPath = path.resolve(__dirname, '../')

const dictList = readdirSync(dictPath).filter((s) => /^wubi.*\.dict\.yaml$/.test(s))

const dictSource = dictList.reduce((acc, cur) => acc + readFileSync(path.join(dictPath, cur), { encoding: 'utf-8' }), '')

const dict = new Map()

categoryDict()

module.exports = {
  dict, dictSource, query, dictPath
}

// ------------------------------------------------------------------------------
function categoryDict() {
  const arr = dictSource.split('\n');
  for (const line of arr) {
    if (/\t(\w{1,4})$/.test(line)) {
      const [word, code] = line.split('\t')
      addToDict(code, word)
    }
  }
}

function addToDict(code, word) {
  if (dict.has(code)) {
    dict.get(code).add(word)
  } else {
    dict.set(code, new Set([word]))
  }
}

function query(word) {
  const result = new RegExp(`\n(${word}\\t\\w{1,4})\\n`, 'g').exec(dictSource)
  return result?.map(s => s.trim().split('\t').reverse())
}
