(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LOLLO_ORDER = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const quantityFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 });
  const maximumAmount = 1000000;
  function productMap(products) { return new Map(products.map(product => [product.id, product])); }
  function optionIndexes(product, indexes) {
    return [...new Set(Array.isArray(indexes) ? indexes : [])]
      .filter(index => Number.isInteger(index) && index >= 0 && index < product.options.length)
      .sort((a, b) => a - b);
  }
  function normalizeLine(line, byId) {
    if (!line || typeof line !== 'object') return null;
    const product = byId.get(line.productId);
    if (!product || !Number.isInteger(line.amount) || line.amount < 1 || line.amount > maximumAmount) return null;
    const options = optionIndexes(product, line.optionIndexes);
    return { key: `${product.id}:${options.join(',')}`, productId: product.id, amount: line.amount, optionIndexes: options };
  }
  function sanitizeCart(lines, products) {
    const byId = productMap(products);
    const result = [];
    if (!Array.isArray(lines)) return result;
    for (const raw of lines) {
      const line = normalizeLine(raw, byId);
      if (!line) continue;
      const existing = result.find(item => item.key === line.key);
      if (existing) existing.amount = Math.min(maximumAmount, existing.amount + line.amount);
      else result.push(line);
    }
    return result;
  }
  function addLine(lines, products, productId, amount, indexes = []) {
    const cart = sanitizeCart(lines, products);
    const line = normalizeLine({ productId, amount, optionIndexes: indexes }, productMap(products));
    if (!line) return cart;
    const existing = cart.find(item => item.key === line.key);
    if (existing) existing.amount = Math.min(maximumAmount, existing.amount + line.amount);
    else cart.push(line);
    return cart;
  }
  function changeAmount(lines, products, key, amount) {
    const cart = sanitizeCart(lines, products);
    if (amount === 0) return cart.filter(line => line.key !== key);
    if (!Number.isInteger(amount) || amount < 1 || amount > maximumAmount) return cart;
    return cart.map(line => line.key === key ? { ...line, amount } : line);
  }
  function removeLine(lines, key) { return lines.filter(line => line.key !== key); }
  function unitPriceCents(line, product) {
    return product.priceCents + optionIndexes(product, line.optionIndexes).reduce((total, index) => total + product.options[index].priceCents, 0);
  }
  function lineTotalCents(line, product) {
    return Math.round(unitPriceCents(line, product) * line.amount / (product.unit === 'kg' ? 1000 : 1));
  }
  function totalCents(lines, products) {
    const byId = productMap(products);
    return sanitizeCart(lines, products).reduce((total, line) => total + lineTotalCents(line, byId.get(line.productId)), 0);
  }
  function parseAmount(product, input) {
    const text = String(input).trim().replace(',', '.');
    const pattern = product.unit === 'kg' ? /^\d+(?:\.\d{1,3})?$/ : /^\d+$/;
    if (!pattern.test(text)) return null;
    let amount;
    if (product.unit === 'kg') {
      const [whole, fraction = ''] = text.split('.');
      amount = Number(whole) * 1000 + Number(fraction.padEnd(3, '0'));
    } else amount = Number(text);
    return Number.isInteger(amount) && amount >= 1 && amount <= maximumAmount ? amount : null;
  }
  function formatAmount(line, product) {
    return product.unit === 'kg' ? `${quantityFormat.format(line.amount / 1000)} kg` : String(line.amount);
  }
  function itemCount(lines, products) {
    const byId = productMap(products);
    return sanitizeCart(lines, products).reduce((total, line) => total + (byId.get(line.productId).unit === 'kg' ? 1 : line.amount), 0);
  }
  function buildMessage(lines, products, notes = '') {
    const cart = sanitizeCart(lines, products);
    if (!cart.length) return '';
    const byId = productMap(products);
    const message = ['Olá! Gostaria de fazer um pedido na Lollo Cake / Auto Posto Pluma.', '', '*Meu pedido:*'];
    let weighed = false;
    cart.forEach((line, index) => {
      const product = byId.get(line.productId);
      weighed ||= product.unit === 'kg';
      message.push(`${index + 1}. ${formatAmount(line, product)} ${product.unit === 'kg' ? 'de' : 'x'} ${product.name} — ${currency.format(lineTotalCents(line, product) / 100)}`);
      message.push(`   ${product.unit === 'kg' ? 'Preço por kg' : 'Valor por unidade'}: ${currency.format(unitPriceCents(line, product) / 100)}`);
      if (line.optionIndexes.length) {
        message.push('   Adicionais: ' + line.optionIndexes.map(optionIndex => {
          const option = product.options[optionIndex];
          return `${option.name} (${option.priceCents ? '+' + currency.format(option.priceCents / 100) : 'sem custo'})`;
        }).join(', '));
      }
      message.push('');
    });
    message.push(`*${weighed ? 'Total estimado dos produtos' : 'Total dos produtos'}: ${currency.format(totalCents(cart, products) / 100)}*`);
    const trimmedNotes = String(notes).trim().slice(0, 1000);
    if (trimmedNotes) message.push('', '*Observações:*', trimmedNotes);
    if (weighed) message.push('', 'Os itens vendidos por peso terão o valor final confirmado na pesagem.');
    message.push('', 'Pode confirmar a disponibilidade e o pedido, por favor?');
    return message.join('\n');
  }
  function buildWhatsAppUrl(phone, message) {
    const number = String(phone);
    if (!/^[1-9]\d{7,14}$/.test(number) || !message) return null;
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  }
  return { sanitizeCart, addLine, changeAmount, removeLine, unitPriceCents, lineTotalCents, totalCents, parseAmount, formatAmount, itemCount, buildMessage, buildWhatsAppUrl };
});
