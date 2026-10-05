export function refactoredCalculateCheckout(order, customer) {
  const DISCOUNT_BY_CATEGORY = {
    electronics: customer.type === "premium" ? 0.1 : 0,
    books: null, // handled by quantity rule
  };

  const TAX_RATE_BY_COUNTRY = { GE: 0.18, US: 0.08 };

  const subtotal = order.items.reduce((sum, item) => {
    const base = item.price * item.quantity;

    const categoryDiscount =
      item.category === "books"
        ? item.quantity >= 3
          ? 0.05
          : 0
        : (DISCOUNT_BY_CATEGORY[item.category] ?? 0);

    return sum + base * (1 - categoryDiscount);
  }, 0);

  const promoDiscount = order.promoCode === "SAVE10" ? 0.1 : 0;
  const afterPromo = subtotal * (1 - promoDiscount);

  const shippingFee =
    afterPromo < 100 ? (customer.type === "premium" ? 5 : 10) : 0;

  const beforeTax = afterPromo + shippingFee;
  const taxRate = TAX_RATE_BY_COUNTRY[order.country] ?? 0;
  const total = beforeTax * (1 + taxRate);

  return Math.round(total * 100) / 100;
}
