import type { Page } from '@playwright/test';

export class CheckoutPage {
  readonly subtotal;
  readonly discount;
  readonly shipping;
  readonly total;
  readonly freeShippingTag;
  readonly couponApplied;
  readonly couponRejected;
  readonly quoteError;
  readonly orderError;
  readonly emptyMessage;

  constructor(private page: Page) {
    const summary = page.getByTestId('summary');
    this.subtotal = summary.getByTestId('subtotal');
    this.discount = summary.getByTestId('discount');
    this.shipping = summary.getByTestId('shipping');
    this.total = summary.getByTestId('total');
    this.freeShippingTag = summary.getByText('grátis');
    this.couponApplied = page.getByTestId('coupon-applied');
    this.couponRejected = page.getByTestId('coupon-rejected');
    this.quoteError = page.getByTestId('quote-error');
    this.orderError = page.getByTestId('order-error');
    this.emptyMessage = page.getByTestId('empty-cart');
  }

  async goto() {
    await this.page.goto('/checkout');
  }

  async calculateShipping(cep: string) {
    await this.page.getByLabel('CEP').fill(cep);
    await this.waitForQuote(() =>
      this.page.getByRole('button', { name: 'Calcular frete' }).click(),
    );
  }

  async applyCoupon(code: string) {
    await this.page.getByLabel('Cupom').fill(code);
    await this.waitForQuote(() => this.page.getByRole('button', { name: 'Aplicar cupom' }).click());
  }

  async fillCustomer(name: string, email: string) {
    await this.page.getByLabel('Nome completo').fill(name);
    await this.page.getByLabel('E-mail').fill(email);
  }

  async placeOrder() {
    await this.page.getByRole('button', { name: 'Finalizar pedido' }).click();
  }

  private async waitForQuote(action: () => Promise<void>) {
    const response = this.page.waitForResponse((res) => res.url().includes('/quote'));
    await action();
    await response;
  }
}
