

function dedent(text = '', minIndent) {
  if (!text) return text

  const lines = text.split('\n')
  let min = minIndent || Number.MAX_VALUE
  for (const line of lines) {
    let index = 0
    while (index < line.length && (line[index] === ' ' || line[index] === '\t')) {
      index++
    }
    if (index === line.length) continue
    if (index < min) min = index
    if (min === 0) return text
  }

  if (min === Number.MAX_VALUE) return lines.map(() => '').join('\n')
  return lines.map(line => line.slice(min)).join('\n')
}

/*
const x = `
Cool

    \`\`\`
    chill
    \`\`\``

console.log(dedent(x))
/** */

module.exports = dedent
