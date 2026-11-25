// Warung Rush — the customers and their orders. The order board fills up over
// the rush: customers arrive faster and grow less patient as the timer runs
// down, and later orders ask for two things at once. This file owns the
// customer list only; serving a plate is the kitchen's job.

import { CUSTOMER_NAMES, CUSTOMER_SHIRTS, CUSTOMER_SKINS, DIFFICULTY, MAX_CUSTOMERS, MENU } from './config.js';
import { intBetween, pick } from './random.js';

/** One thing a customer wants: a dish by recipe, or a drink. */
export function orderItem(kind, recipe) {
  return { kind, recipe: recipe ?? null, served: false };
}

export function createOrderManager(rng) {
  const customers = [];
  let nextCustomerId = 1;
  let spawnTimer = DIFFICULTY.firstOrderAt;
  let elapsed = 0;
  let nameIndex = 0;

  function patienceFor() {
    const t = Math.min(1, elapsed / DIFFICULTY.spawnRampAt);
    return DIFFICULTY.patienceStart + (DIFFICULTY.patienceEnd - DIFFICULTY.patienceStart) * t;
  }

  function spawnEvery() {
    const t = Math.min(1, elapsed / DIFFICULTY.spawnRampAt);
    return DIFFICULTY.spawnEveryStart + (DIFFICULTY.spawnEveryEnd - DIFFICULTY.spawnEveryStart) * t;
  }

  function doubleChance() {
    const t = Math.min(1, elapsed / DIFFICULTY.doubleOrderRampAt);
    return DIFFICULTY.doubleOrderChanceStart + (DIFFICULTY.doubleOrderChanceEnd - DIFFICULTY.doubleOrderChanceStart) * t;
  }

  function makeOrder() {
    const dishes = ['nasi-goreng', 'mie-goreng'];
    const items = [orderItem('dish', pick(rng, dishes))];
    if (rng() < doubleChance()) items.push(orderItem('drink'));
    return items;
  }

  function spawnCustomer() {
    if (customers.length >= MAX_CUSTOMERS) return null;
    const patience = patienceFor();
    const customer = {
      id: nextCustomerId,
      name: CUSTOMER_NAMES[nameIndex % CUSTOMER_NAMES.length],
      skin: CUSTOMER_SKINS[intBetween(rng, 0, CUSTOMER_SKINS.length - 1)],
      shirt: CUSTOMER_SHIRTS[intBetween(rng, 0, CUSTOMER_SHIRTS.length - 1)],
      items: makeOrder(),
      patience,
      maxPatience: patience,
      angry: false,
    };
    nameIndex += 1;
    nextCustomerId += 1;
    customers.push(customer);
    return customer;
  }

  return {
    customers,

    /** Advance timers: spawn new customers, drain patience, drop the angry ones. */
    update(dt, onNewCustomer, onCustomerLeft) {
      elapsed += dt;
      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        const customer = spawnCustomer();
        spawnTimer = spawnEvery();
        if (customer !== null && onNewCustomer) onNewCustomer(customer);
      }
      for (let i = customers.length - 1; i >= 0; i -= 1) {
        const customer = customers[i];
        customer.patience -= dt;
        if (customer.patience <= 0) {
          customer.angry = true;
          customers.splice(i, 1);
          if (onCustomerLeft) onCustomerLeft(customer);
        }
      }
    },

    /** The first customer still waiting on an item like `item`, or null. */
    findCustomerFor(item) {
      for (const customer of customers) {
        for (const wanted of customer.items) {
          if (wanted.served) continue;
          if (wanted.kind === 'drink' && item.kind === 'drink') return { customer, wanted };
          if (wanted.kind === 'dish' && item.kind === 'dish' && wanted.recipe === item.recipe) {
            return { customer, wanted };
          }
        }
      }
      return null;
    },

    /** Whether the carried item matches any waiting order. */
    matchesAny(item) {
      return this.findCustomerFor(item) !== null;
    },

    /** Mark one wanted item served; returns the customer when their whole order is done. */
    serve(item) {
      const found = this.findCustomerFor(item);
      if (!found) return null;
      found.wanted.served = true;
      if (found.customer.items.every((wanted) => wanted.served)) {
        const index = customers.indexOf(found.customer);
        if (index >= 0) customers.splice(index, 1);
        return found.customer;
      }
      return null;
    },

    /** What one served item is worth, before combo and tip. */
    priceOf(item) {
      if (item.kind === 'drink') return MENU['es-teh'].price;
      return MENU[item.recipe].price;
    },

    waitingCount() {
      return customers.length;
    },
  };
}
