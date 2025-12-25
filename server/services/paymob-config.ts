import { z } from "zod";

const paymobEnvSchema = z.object({
  PAYMOB_SECRET_KEY: z.string().min(1, { message: "PAYMOB_SECRET_KEY is required" }),
  PAYMOB_PUBLIC_KEY: z.string().min(1, { message: "PAYMOB_PUBLIC_KEY is required" }),
  PAYMOB_INTEGRATION_ID_CAPTURE: z.string().min(1, { message: "PAYMOB_INTEGRATION_ID_CAPTURE is required" }),
  PAYMOB_INTEGRATION_ID_USD: z.string().min(1, { message: "PAYMOB_INTEGRATION_ID_USD is required" }),
  PAYMOB_BASE_URL: z.string().url({ message: "PAYMOB_BASE_URL must be a valid URL" }),
  PAYMOB_DEFAULT_CURRENCY: z.string().optional(),
});

const SUPPORTED_CURRENCIES = ["USD", "EGP"] as const;

function normalizeCurrency(input?: string) {
  const normalized = input?.toUpperCase();
  return SUPPORTED_CURRENCIES.includes(normalized as typeof SUPPORTED_CURRENCIES[number])
    ? (normalized as typeof SUPPORTED_CURRENCIES[number])
    : null;
}

export type PaymobEnv = ReturnType<typeof getPaymobEnv>;

export function getPaymobEnv() {
  const result = paymobEnvSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    throw new Error(`Invalid Paymob configuration: ${JSON.stringify(errors)}`);
  }

  const { PAYMOB_DEFAULT_CURRENCY, ...env } = result.data;
  const currency = normalizeCurrency(PAYMOB_DEFAULT_CURRENCY) ?? "USD";

  return {
    ...env,
    currency,
    supportedCurrencies: SUPPORTED_CURRENCIES,
  } as const;
}

export function getPaymobPublicConfig(preferredCurrency?: string) {
  const env = getPaymobEnv();
  const currency = normalizeCurrency(preferredCurrency) ?? env.currency;

  return {
    baseUrl: env.PAYMOB_BASE_URL,
    publicKey: env.PAYMOB_PUBLIC_KEY,
    integrationIdCapture: env.PAYMOB_INTEGRATION_ID_CAPTURE,
    integrationIdUsd: env.PAYMOB_INTEGRATION_ID_USD,
    currency,
    supportedCurrencies: env.supportedCurrencies,
  } as const;
}

export function getPaymobSecretKey() {
  const env = getPaymobEnv();
  return env.PAYMOB_SECRET_KEY;
}
