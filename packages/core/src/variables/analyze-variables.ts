import type { ExpressionModel, SourceLocation, StructureNode, VariableInfo } from '../schema'

interface MutableVariableInfo extends VariableInfo {
  contexts: string[]
}

function addContext(variable: MutableVariableInfo, context: string) {
  if (!variable.contexts.includes(context)) {
    variable.contexts.push(context)
  }
}

function collectDeclarations(
  nodes: StructureNode[],
  variables: Map<string, MutableVariableInfo>,
  context: string,
) {
  for (const node of nodes) {
    if (node.kind === 'variable' && !variables.has(node.name)) {
      const variable: MutableVariableInfo = {
        name: node.name,
        declaration: node.nameLocation,
        reads: [],
        writes: [],
        contexts: [context],
      }
      if (node.initializer) {
        variable.initialValue = node.initializer
      }
      variables.set(node.name, variable)
    }
    if (node.kind === 'if') {
      collectDeclarations(node.consequent, variables, `${context} > if:true`)
      collectDeclarations(node.alternate, variables, `${context} > if:false`)
    }
    if (node.kind === 'for') {
      if (node.initialization?.kind === 'declaration' && !variables.has(node.initialization.name)) {
        const variable: MutableVariableInfo = {
          name: node.initialization.name,
          declaration: node.initialization.nameLocation,
          reads: [],
          writes: [],
          contexts: [`${context} > for`],
        }
        if (node.initialization.initializer) {
          variable.initialValue = node.initialization.initializer
        }
        variables.set(variable.name, variable)
      }
      collectDeclarations(node.body, variables, `${context} > for:body`)
    }
  }
}

function addRead(
  variables: Map<string, MutableVariableInfo>,
  name: string,
  location: SourceLocation,
  context: string,
) {
  const variable = variables.get(name)
  if (!variable) {
    return
  }
  variable.reads.push(location)
  addContext(variable, context)
}

function addWrite(
  variables: Map<string, MutableVariableInfo>,
  name: string,
  location: SourceLocation,
  operation: string,
  context: string,
) {
  const variable = variables.get(name)
  if (!variable) {
    return
  }
  variable.writes.push({ location, operation })
  addContext(variable, context)
}

function walkExpression(
  expression: ExpressionModel,
  variables: Map<string, MutableVariableInfo>,
  context: string,
) {
  switch (expression.kind) {
    case 'identifier':
      addRead(variables, expression.name, expression.location, context)
      break
    case 'binary':
    case 'logical':
      walkExpression(expression.left, variables, context)
      walkExpression(expression.right, variables, context)
      break
    case 'unary':
      walkExpression(expression.argument, variables, context)
      break
    case 'assignment':
      if (expression.operator !== '=') {
        addRead(variables, expression.target.name, expression.target.location, context)
      }
      walkExpression(expression.value, variables, context)
      addWrite(
        variables,
        expression.target.name,
        expression.target.location,
        expression.operator,
        context,
      )
      break
    case 'update':
      addRead(variables, expression.argument.name, expression.argument.location, context)
      addWrite(
        variables,
        expression.argument.name,
        expression.argument.location,
        expression.operator,
        context,
      )
      break
    case 'declaration':
      if (expression.initializer) {
        walkExpression(expression.initializer, variables, context)
      }
      break
    case 'parenthesized':
      walkExpression(expression.expression, variables, context)
      break
    case 'literal':
    case 'unsupported':
      break
  }
}

function walkNodes(
  nodes: StructureNode[],
  variables: Map<string, MutableVariableInfo>,
  context: string,
) {
  for (const node of nodes) {
    switch (node.kind) {
      case 'variable':
        if (node.initializer) {
          walkExpression(node.initializer, variables, context)
        }
        break
      case 'assignment':
      case 'update':
      case 'expression':
        walkExpression(node.expression, variables, context)
        break
      case 'output':
        node.arguments.forEach((argument) => walkExpression(argument, variables, context))
        break
      case 'if':
        walkExpression(node.condition, variables, `${context} > if:condition`)
        walkNodes(node.consequent, variables, `${context} > if:true`)
        walkNodes(node.alternate, variables, `${context} > if:false`)
        break
      case 'for':
        if (node.initialization) {
          walkExpression(node.initialization, variables, `${context} > for:initialization`)
        }
        if (node.condition) {
          walkExpression(node.condition, variables, `${context} > for:condition`)
        }
        walkNodes(node.body, variables, `${context} > for:body`)
        if (node.update) {
          walkExpression(node.update, variables, `${context} > for:update`)
        }
        break
      case 'unsupported':
        break
    }
  }
}

export function analyzeVariables(structure: StructureNode[]): VariableInfo[] {
  const variables = new Map<string, MutableVariableInfo>()
  collectDeclarations(structure, variables, 'top-level')
  walkNodes(structure, variables, 'top-level')
  return [...variables.values()]
}
