const YAML = require('yaml')
const { cleanValue } = require('./_clean-value')

/*
// Create a new YAML document and stringify it
const yamlStr = objectToYaml(item, indent + 2)
// Ensure yamlStr is indented but not first line
const indentedYamlStr = yamlStr.split('\n').map((line, index) => index === 0 ? line : `${spaces}  ${line}`).join('\n')
result += `${spaces}- ${indentedYamlStr}`
*/

function arrayToYaml(arr, indent = 0, options = {}) {
  // console.log('arrayToYaml', arr)
  let result = ''
  const { quoteType = 'none' } = options

  function getQuotedString(str) {
    if (quoteType === 'none') return str

    const quote = quoteType === 'double' ? '"' : "'"

    // When quoteType is set, always quote strings
    if (quoteType === 'single' || quoteType === 'double') {
      // Escape quotes of the same type
      if (quoteType === 'single') {
        // For single quotes, escape with backslash
        return `'${str.replace(/'/g, "\\'")}'`
      } else {
        // For double quotes, escape with backslash
        return `"${str.replace(/"/g, '\\"')}"`
      }
    }

    // Only quote strings that need it for default behavior
    const needsQuotes = (
      str.includes('\n') ||
      str.startsWith(quote) ||
      str.endsWith(quote) ||
      str.includes(': ') ||
      str.includes(' #') ||
      str.includes('- ') ||
      (quoteType === 'single' && str.includes("'")) ||
      (quoteType === 'double' && str.includes('"'))
    )

    if (!needsQuotes) {
      return str
    }

    // For unforced quotes, use YAML spec escaping
    if (quoteType === 'single') {
      // For single quotes, double them (YAML spec)
      return `'${str.replace(/'/g, "''")}'`
    } else {
      return `"${str.replace(/"/g, '\\"')}"`
    }
  }

  function formatObject(obj, level) {
    let output = ''
    const baseIndent = ' '.repeat(level)

    Object.entries(obj).forEach(([key, value], index) => {
      // First line has no indent (comes after dash), subsequent lines indent by 2
      const lineIndent = index === 0 ? '' : ' '.repeat(2)

      // Handle special YAML tags
      if (key === 'Ref') {
        output += `${lineIndent}${key}: !Ref ${value}\n`
        return
      }

      if (key === 'Fn::Join') {
        output += `${lineIndent}Join: !Join\n`
        const [delimiter, values] = value
        output += `${baseIndent}  - '${delimiter}'\n`
        output += `${baseIndent}  - ${arrayToYaml(values, level + 4).trimLeft()}`
        return
      }

      if (key === 'Fn::Sub') {
        output += `${lineIndent}Sub: !Sub '${value}'\n`
        return
      }

      // Handle regular values
      if (Array.isArray(value)) {
        output += `${lineIndent}${key}:\n`
        output += arrayToYaml(value, level + 2, options)
      } else if (typeof value === 'object' && value !== null) {
        output += `${lineIndent}${key}:\n`
        output += formatObject(value, level + 2)
      } else {
        output += `${lineIndent}${key}: ${value}\n`
      }
    })

    return output.trimRight()
  }

  if (!Array.isArray(arr)) {
    return result
  }

  arr.forEach((item, index) => {
    const spaces = ' '.repeat(indent)
    const isLastItem = index === arr.length - 1

    if (Array.isArray(item)) {
      if (item.length === 0) {
        result += `${spaces}- []\n`
      } else {
        result += `${spaces}- ${arrayToYaml(item, indent + 2, options).trimLeft()}${isLastItem ? '' : '\n'}`
      }
    } else if (item && typeof item === 'object') {
      // Handle each intrinsic function
      if ('Fn::Join' in item) {
        result += `${spaces}- !Join\n`
        result += `${spaces}  - '${item['Fn::Join'][0]}'\n`
        const joinValues = arrayToYaml(item['Fn::Join'][1], indent + 4).trimLeft()
        result += `${spaces}  - ${joinValues}${isLastItem ? '' : '\n'}`
      } else if ('Ref' in item) {
        result += `${spaces}- !Ref ${item['Ref']}${isLastItem ? '' : '\n'}`
      } else if ('Fn::Ref' in item) {
        result += `${spaces}- !Ref ${item['Fn::Ref']}\n`
      } else if ('Fn::GetAtt' in item) {
        result += `${spaces}- !GetAtt ${item['Fn::GetAtt'].join('.')}\n`
      } else if ('Fn::Sub' in item) {
        if (Array.isArray(item['Fn::Sub'])) {
          result += `${spaces}- !Sub\n`
          result += `${spaces}  - '${item['Fn::Sub'][0]}'\n`
          result += `${spaces}  - ${arrayToYaml(item['Fn::Sub'][1], indent + 4).trimLeft()}\n`
        } else {
          result += `${spaces}- !Sub '${item['Fn::Sub']}'\n`
        }
      } else if ('Fn::ImportValue' in item) {
        result += `${spaces}- !ImportValue ${item['Fn::ImportValue']}`
      } else if ('Fn::FindInMap' in item) {
        result += `${spaces}- !FindInMap [${item['Fn::FindInMap'].join(', ')}]`
      } else if ('Fn::Base64' in item) {
        result += `${spaces}- !Base64 '${item['Fn::Base64']}'`
      } else if ('Fn::Cidr' in item) {
        result += `${spaces}- !Cidr [${item['Fn::Cidr'].join(', ')}]`
      } else if ('Fn::Select' in item) {
        result += `${spaces}- !Select [${item['Fn::Select'].join(', ')}]`
      } else if ('Fn::Split' in item) {
        result += `${spaces}- !Split [${item['Fn::Split'].join(', ')}]`
      } else if ('Fn::Transform' in item) {
        result += `${spaces}- !Transform ${item['Fn::Transform']}`
      } else if ('Condition' in item) {
        result += `${spaces}- !Condition ${item['Condition']}`
      } else {
        // Use formatObject for regular objects
        const formatted = formatObject(item, indent)
          .split('\n')
          .map((line, i) => {
            if (i === 0) return `${spaces}- ${line}`
            return `${spaces}${line}`
          })
          .filter(Boolean)
          .join('\n')
        result += formatted + (isLastItem ? '' : '\n')
      }
    } else {
      // Handle strings
      if (item && typeof item === 'string' && item.includes('\n')) {
        const indentedItem = item.split('\n').map((line) => `${spaces}  ${line}`).join('\n')
        result += `${spaces}- |\n${indentedItem}${isLastItem ? '' : '\n'}`
      } else {
        result += `${spaces}- ${getQuotedString(item)}${isLastItem ? '' : '\n'}`
      }
    }
  })

  return result
}

function objectToYaml(obj, indent = 0) {
  const doc = new YAML.Document()
  doc.contents = obj
  const yamlStr = doc.toString({
    indent: 2,
    lineWidth: -1,
    minContentWidth: 0,
    doubleQuotedAsJSON: true
  }).trim()
  return cleanValue(yamlStr)
}

module.exports = {
  arrayToYaml,
}
