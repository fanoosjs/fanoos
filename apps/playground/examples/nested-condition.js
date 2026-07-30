/**
 * Demonstrates nested decisions.
 *
 * @category control-flow
 */

let score = 72
let result = 'review'

if (score >= 60) {
  if (score >= 90) {
    result = 'excellent'
  } else {
    result = 'passed'
  }
} else {
  result = 'failed'
}

console.log(result)
