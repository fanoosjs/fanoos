/**
 * Demonstrates graceful unsupported-syntax diagnostics.
 */

let value = 2

function double(input) {
  return input * 2
}

const { result } = value
value = value + 1

console.log(value)
