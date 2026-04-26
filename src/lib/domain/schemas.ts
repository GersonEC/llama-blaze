import { z } from 'zod';
import { RESERVATION_STATUSES } from './reservation';
import { SUPPORTED_CURRENCIES } from './money';
import { PRODUCT_CATEGORIES, PRODUCT_STATUSES } from './product';

/** Kebab-case slug, 1–80 chars, used in `/shop/[slug]`. */
const slugSchema = z
  .string()
  .trim()
  .min(1, 'Slug is required')
  .max(80)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Use lowercase letters, numbers, and hyphens',
  );

const requiredCentsSchema = z
  .number()
  .int('Must be a whole number of cents')
  .nonnegative('Cannot be negative');

/** One color option in the admin product form. */
export const ProductVariantFormSchema = z.object({
  id: z.string().uuid().nullable().default(null),
  name: z.string().trim().min(1, 'Name is required').max(80),
  hex: z.string().trim().min(1, 'Color is required').max(40),
  stock: z
    .number()
    .int('Stock must be a whole number')
    .nonnegative('Stock cannot be negative'),
  position: z.number().int().nonnegative().default(0),
});
export type ProductVariantFormInput = z.infer<typeof ProductVariantFormSchema>;

/** Admin form schema for creating/editing products. */
export const ProductFormSchema = z
  .object({
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
    status: z.enum(PRODUCT_STATUSES).default('draft'),
    category: z.enum(PRODUCT_CATEGORIES).nullable().default(null),
    discountPercentage: z
      .number()
      .int('Discount must be a whole number')
      .min(1, 'Discount must be at least 1%')
      .max(90, 'Discount cannot exceed 90%')
      .nullable()
      .default(null),
    acquisitionCostCents: requiredCentsSchema,
    shippingCostCents: requiredCentsSchema,
    variants: z.array(ProductVariantFormSchema).max(20).default([]),
  })
  .superRefine((data, ctx) => {
    const seen = new Set<string>();
    data.variants.forEach((v, index) => {
      const key = v.name.trim().toLowerCase();
      if (seen.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['variants', index, 'name'],
          message: 'Duplicate color name',
        });
      }
      seen.add(key);
    });
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
        variantId: z
          .string()
          .uuid('Invalid variant id')
          .nullable()
          .optional()
          .transform((v) => v ?? null),
        quantity: z.number().int().positive().max(99),
      }),
    )
    .min(1, 'Your cart is empty'),
});
export type CheckoutInput = z.infer<typeof CheckoutInputSchema>;

/** Admin form schema for recording a restock against a specific variant. */
export const ProductVariantPurchaseSchema = z.object({
  variantId: z.string().uuid('Invalid variant id'),
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
export type ProductVariantPurchaseInput = z.infer<
  typeof ProductVariantPurchaseSchema
>;

/** Admin: change a reservation's status. */
export const ReservationStatusUpdateSchema = z.object({
  reservationId: z.string().uuid(),
  status: z.enum(RESERVATION_STATUSES),
});
export type ReservationStatusUpdateInput = z.infer<
  typeof ReservationStatusUpdateSchema
>;

/** Admin login form. */
export const AdminLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(6, 'Password too short'),
});
export type AdminLoginInput = z.infer<typeof AdminLoginSchema>;

/** Set / change password form (used by invite acceptance + recovery). */
export const SetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    path: ['confirm'],
    message: 'Passwords do not match',
  });
export type SetPasswordInput = z.infer<typeof SetPasswordSchema>;

/** Forgot-password form. */
export const ForgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
});
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
