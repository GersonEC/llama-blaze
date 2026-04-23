import { z } from 'zod';
import { RESERVATION_STATUSES } from './reservation';
import { SUPPORTED_CURRENCIES } from './money';
import { PRODUCT_CATEGORIES } from './product';

/** Kebab-case slug, 1–80 chars, used in `/shop/[slug]`. */
const slugSchema = z
  .string()
  .trim()
  .min(1, 'Slug is required')
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and hyphens');

const nonNegativeCentsSchema = z
  .number()
  .int('Must be a whole number of cents')
  .nonnegative('Cannot be negative')
  .nullable()
  .default(null);

/** Admin form schema for creating/editing products. */
export const ProductFormSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(1, 'Name is required').max(120),
  description: z.string().trim().max(4000).default(''),
  priceCents: z
    .number()
    .int('Price must be a whole number of cents')
    .nonnegative('Price cannot be negative'),
  currency: z.enum(SUPPORTED_CURRENCIES),
  stock: z.number().int().nonnegative('Stock cannot be negative'),
  images: z.array(z.string().min(1)).max(10).default([]),
  active: z.boolean().default(true),
  category: z.enum(PRODUCT_CATEGORIES).nullable().default(null),
  discountPercentage: z
    .number()
    .int('Discount must be a whole number')
    .min(1, 'Discount must be at least 1%')
    .max(90, 'Discount cannot exceed 90%')
    .nullable()
    .default(null),
  acquisitionCostCents: nonNegativeCentsSchema,
  shippingCostCents: nonNegativeCentsSchema,
});
export type ProductFormInput = z.infer<typeof ProductFormSchema>;

/** Admin form schema for recording a new restock / purchase. */
export const ProductPurchaseSchema = z.object({
  productId: z.string().uuid('Invalid product id'),
  purchasedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use yyyy-mm-dd')
    .nullable()
    .default(null),
  quantity: z
    .number()
    .int('Quantity must be a whole number')
    .positive('Quantity must be at least 1')
    .max(100000),
  unitCostCents: z
    .number()
    .int('Must be a whole number of cents')
    .nonnegative('Unit cost cannot be negative'),
  shippingCostCents: z
    .number()
    .int('Must be a whole number of cents')
    .nonnegative('Shipping cost cannot be negative')
    .default(0),
  notes: z.string().trim().max(1000).default(''),
});
export type ProductPurchaseInput = z.infer<typeof ProductPurchaseSchema>;

/** Public checkout payload submitted by the customer. */
export const CheckoutInputSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(1, 'Name is required').max(120),
    email: z.string().trim().toLowerCase().email('Enter a valid email'),
    phone: z
      .string()
      .trim()
      .min(5, 'Phone is required')
      .max(40)
      .regex(/^[+0-9 ()\-.]+$/, 'Only digits, spaces and +()-. allowed'),
    pickupNotes: z.string().trim().max(1000).default(''),
  }),
  items: z
    .array(
      z.object({
        productId: z.string().uuid('Invalid product id'),
        quantity: z.number().int().positive().max(99),
      }),
    )
    .min(1, 'Your cart is empty'),
});
export type CheckoutInput = z.infer<typeof CheckoutInputSchema>;

/** Admin: change a reservation's status. */
export const ReservationStatusUpdateSchema = z.object({
  reservationId: z.string().uuid(),
  status: z.enum(RESERVATION_STATUSES),
});
export type ReservationStatusUpdateInput = z.infer<typeof ReservationStatusUpdateSchema>;

/** Admin login form. */
export const AdminLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(6, 'Password too short'),
});
export type AdminLoginInput = z.infer<typeof AdminLoginSchema>;
