'use strict';
/**
 * Fork from babel-plugin-auto-import
 */
// https://github.com/michalkvasnicak/babel-plugin-css-modules-transform/blob/master/src/index.js
// https://github.com/vslinko/babel-plugin-react-require/blob/master/src/index.js
const { basename } = require('path')
const template = require('@babel/template').default
const not = require('logical-not')

Object.defineProperty(exports, '__esModule', { value: true })
exports['default'] = _default

const ImportType = {
  DEFAULT: Symbol('DEFAULT'),
  MEMBER: Symbol('MEMBER'),
  ANONYMOUS: Symbol('ANONYMOUS')
}

const matchExtensions = /\.module\.css$/i

function _default(_ref) {
  var t = _ref.types
  return {
    visitor: {
      ImportDefaultSpecifier(path, _ref2) {
        const { value } = path.parentPath.node.source
        // let cache = []
        if (matchExtensions.test(value)) {
          const niceFilePath = _ref2.file.opts.filename.replace(process.cwd(), '')
          const globalId = _ref2.file.opts.filename
          const originalName = path.node.local.name
          // console.log('CSS MODULE!', value)
          // console.log('path.node.local.name', originalName)
          // console.log('path.node', path.node)
          const modifiedCSSModuleImportName = '___' + originalName
          /* Change default css import name to `_${original}` */
          path.node.local.name = modifiedCSSModuleImportName

          /* Selector is wrong here. need parent if refactoring
          var programBody = program.get('body');
          var currentImportDeclarations = programBody.reduce(toImportDeclarations, []);
          var identifier = path.node
          console.log('identifier', identifier)
          const declaration = { 'default': 'styleGuard', 'path': 'style-guard' }
          var importType = null;
          if (hasDefault(declaration, identifier)) {
            importType = ImportType.DEFAULT;
          } else if (hasMember(declaration, identifier)) {
            importType = ImportType.MEMBER;
          } else if (hasAnonymous(declaration, identifier)) {
            importType = ImportType.ANONYMOUS;
          }
          console.log('importType', importType)
          // console.log('currentImportDeclarations', currentImportDeclarations)
          const alreadyAdded = currentImportDeclarations.some(importAlreadyExists, {
            identifier: identifier,
            type: importType,
            pathToModule: 'style-guard'
          });
          console.log('alreadyAdded', alreadyAdded)

          // console.log('currentImportDeclarations', currentImportDeclarations)
          /* Inject style guard */

          /*
          // @TODO check if already imported. cache doesnt work
          console.log('cache', cache)
          if (!cache.includes(globalId)) {
            // var importDeclaration = t.importDeclaration(
            //   [t.importDefaultSpecifier(t.identifier('styleGuard'))], t.stringLiteral('style-guard')
            // );
            // const [ importThing ] = program.unshiftContainer('body', importDeclaration);
            // cache.push(globalId)
          }
          */

          /* Inject style guard wrapper */
          const program = path.findParent(isProgram)
          const varDeclarationTest = t.variableDeclaration('var',
            [
              t.variableDeclarator(
                // Assign the original CSS module import name to this new variable
                t.identifier(originalName),
                // Wrap the css class object with styleguard
                template.expression('styleGuard(SHEET_OBJ_REF, CSS_FILE_NAME, FILE_NAME, VAR_NAME)')({
                  SHEET_OBJ_REF: modifiedCSSModuleImportName,
                  CSS_FILE_NAME: JSON.stringify(value),
                  FILE_NAME: JSON.stringify(niceFilePath),
                  VAR_NAME: JSON.stringify(originalName)
                })
              )
            ]
          )
          program.unshiftContainer('body', varDeclarationTest)
        }
      },
      CallExpression(path, { file }) {
        const { callee: { name: calleeName }, arguments: args } = path.node

        if (calleeName !== 'require' || !args.length || !t.isStringLiteral(args[0])) {
          return
        }
        const [{ value: stylesheetPath }] = args;
        if (matchExtensions.test(stylesheetPath)) {
          console.log('CSS MODULE required!', stylesheetPath)
        }
      },
      // Handle imports for style-g
      Identifier: function Identifier(path, _ref2) {
        var options = _ref2.opts
        var file = _ref2.file
        if (not(path.isReferencedIdentifier())) {
          return
        }
        var identifier = path.node
        var scope = path.scope
        if (isDefined(identifier, scope)) {
          // console.log('Is defined! exit')
          return
        }
        // include styleguard
        const declarations = [
          {
            default: 'styleGuard',
            path: 'style-guard'
          }
        ]
        // var declarations = options.declarations;
        if (not(Array.isArray(declarations))) {
          return
        }
        var filename = file.opts.filename ? basename(file.opts.filename) : ''
        declarations.some(handleDeclaration, {
          path: path,
          identifier: identifier,
          filename: filename
        })
      }
    }
  }

  function isDefined(identifier, _ref3) {
    var bindings = _ref3.bindings
    var parent = _ref3.parent
    var variables = Object.keys(bindings)
    if (variables.some(has, identifier)) {
      return true
    }
    return parent ? isDefined(identifier, parent) : false
  }

  function has(identifier) {
    const name = this.name
    return identifier === name
  }

  function handleDeclaration(declaration) {
    var path = this.path
    var identifier = this.identifier
    var filename = this.filename
    if (not(declaration)) {
      return
    }
    var importType = null

    if (hasDefault(declaration, identifier)) {
      importType = ImportType.DEFAULT;
    } else if (hasMember(declaration, identifier)) {
      importType = ImportType.MEMBER;
    } else if (hasAnonymous(declaration, identifier)) {
      importType = ImportType.ANONYMOUS;
    }

    if (importType) {
      var program = path.findParent(isProgram);
      var pathToModule = getPathToModule(declaration, filename);
      // console.log('pathToModulexxxx', pathToModule)
      insertImport(program, identifier, importType, pathToModule);
      return true
    }
  }

  function hasDefault(declaration, identifier) {
    return declaration['default'] === identifier.name;
  }

  function hasMember(declaration, identifier) {
    var members = Array.isArray(declaration.members) ? declaration.members : [];
    return members.some(has, identifier);
  }

  function hasAnonymous(declaration, identifier) {
    var anonymous = Array.isArray(declaration.anonymous) ? declaration.anonymous : [];
    return anonymous.some(has, identifier);
  }

  function insertImport(program, identifier, type, pathToModule) {
    var programBody = program.get('body');
    var currentImportDeclarations = programBody.reduce(toImportDeclarations, []);
    var importDidAppend;
    importDidAppend = currentImportDeclarations.some(importAlreadyExists, {
      identifier: identifier,
      type: type,
      pathToModule: pathToModule
    });
    if (importDidAppend) return;
    importDidAppend = currentImportDeclarations.some(addToImportDeclaration, {
      identifier: identifier,
      type: type,
      pathToModule: pathToModule
    });
    if (importDidAppend) return;
    var specifiers = [];

    if (type === ImportType.DEFAULT) {
      specifiers.push(t.importDefaultSpecifier(identifier))
    } else if (type === ImportType.MEMBER) {
      specifiers.push(t.importSpecifier(identifier, identifier))
    } else if (type === ImportType.ANONYMOUS) {

    }

    // console.log('Do insert into', identifier)
    // Do insertion here
    var importDeclaration = t.importDeclaration(specifiers, t.stringLiteral(pathToModule))
    program.unshiftContainer('body', importDeclaration)

    /* Extra stuff I added
    console.log('identifier', identifier)
    const varDeclarationTest = t.variableDeclaration(
      'var',
        [
          t.variableDeclarator(
            // t.identifier(path.node.local.name),
            t.identifier('styles'),
            template.expression('styleGuard(SHEET_NAME)')({
              SHEET_NAME: '_styles'
            })
          )
        ]
    );
    program.unshiftContainer('body', varDeclarationTest);
    const varDeclaration = t.variableDeclaration(
      'var',
        [
          t.variableDeclarator(
            // t.identifier(path.node.local.name),
            t.identifier('whatever'),
            t.stringLiteral('foo')
          )
        ]
    );
    program.unshiftContainer('body', varDeclaration);
    */
  }

  function isProgram(path) {
    return path.isProgram();
  }

  function toImportDeclarations(list, currentPath) {
    if (currentPath.isImportDeclaration()) list.push(currentPath);
    return list;
  }

  function importAlreadyExists(_ref4) {
    var importDeclaration = _ref4.node
    var identifier = this.identifier
    var type = this.type
    var pathToModule = this.pathToModule

    if (importDeclaration.source.value === pathToModule) {
      if (type === ImportType.ANONYMOUS) return true;
      return importDeclaration.specifiers.some(checkSpecifierLocalName, identifier);
    }
  }

  function checkSpecifierLocalName(specifier) {
    const identifier = this
    return specifier.local.name === identifier.name
  }

  function addToImportDeclaration(importDeclarationPath) {
    var identifier = this.identifier
    var type = this.type
    var pathToModule = this.pathToModule
    var node = importDeclarationPath.node
    if (node.source.value !== pathToModule) {
      return false
    }
    var specifiers = node.specifiers

    if (type === ImportType.DEFAULT) {
      if (not(specifiers.some(hasImportDefaultSpecifier))) {
        var specifier = t.importDefaultSpecifier(identifier);
        importDeclarationPath.unshiftContainer('specifiers', specifier);
        return true
      }
    }

    if (type === ImportType.MEMBER) {
      if (not(specifiers.some(hasSpecifierWithName, identifier))) {
        var _specifier = t.importSpecifier(identifier, identifier)

        importDeclarationPath.pushContainer('specifiers', _specifier)
        return true
      }
    }
  }

  function hasImportDefaultSpecifier(node) {
    return t.isImportDefaultSpecifier(node)
  }

  function hasSpecifierWithName(node) {
    if (not(t.isImportSpecifier(node))) return false
    const name = this.name
    return node.imported.name === name
  }

  function getPathToModule(declaration, filename) {
    if (declaration.path.includes('[name]')) {
      const pattern = declaration.nameReplacePattern || '\\.js$'
      const newSubString = declaration.nameReplaceString || ''
      const name = filename.replace(new RegExp(pattern), newSubString)
      return declaration.path.replace('[name]', name)
    }

    return declaration.path
  }
}
