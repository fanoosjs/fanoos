/**
 * Calculates the final price of five generated items.
 *
 * Items priced above 200 receive a ten percent discount.
 * An additional discount is applied when at least two expensive items exist.
 *
 * @category pricing
 */

let total = 0
let expensiveItems = 0

for (let i = 0; i < 5; i++) {
  const price = i * 120

  if (price > 200) {
    total = total + price * 0.9
    expensiveItems++
  } else {
    total = total + price
  }
}

if (expensiveItems >= 2) {
  total = total - 50
}

console.log(total)
