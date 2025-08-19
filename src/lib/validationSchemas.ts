import { z } from "zod";

// User schemas
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres")
});

export const signupSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres")
    .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
    .regex(/[a-z]/, "Senha deve conter pelo menos uma letra minúscula")
    .regex(/[0-9]/, "Senha deve conter pelo menos um número"),
  confirmPassword: z.string(),
  firstName: z.string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(50, "Nome deve ter no máximo 50 caracteres")
    .regex(/^[A-Za-zÀ-ÿ\s]+$/, "Nome deve conter apenas letras"),
  lastName: z.string()
    .min(2, "Sobrenome deve ter pelo menos 2 caracteres")  
    .max(50, "Sobrenome deve ter no máximo 50 caracteres")
    .regex(/^[A-Za-zÀ-ÿ\s]+$/, "Sobrenome deve conter apenas letras"),
  cpf: z.string()
    .length(11, "CPF deve ter exatamente 11 dígitos")
    .regex(/^\d{11}$/, "CPF deve conter apenas números")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"]
}).refine((data) => {
  // Validação básica de CPF
  const cpf = data.cpf;
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(10))) return false;
  
  return true;
}, {
  message: "CPF inválido",
  path: ["cpf"]
});

// Listing schemas
export const listingSchema = z.object({
  title: z.string()
    .min(5, "Título deve ter pelo menos 5 caracteres")
    .max(100, "Título deve ter no máximo 100 caracteres"),
  description: z.string()
    .min(20, "Descrição deve ter pelo menos 20 caracteres")
    .max(2000, "Descrição deve ter no máximo 2000 caracteres"),
  price: z.number()
    .min(0, "Preço deve ser positivo")
    .max(999999, "Preço muito alto"),
  currency: z.enum(["BRL", "USD", "EUR"]).default("BRL"),
  category: z.string().min(1, "Categoria é obrigatória"),
  location: z.string().min(3, "Localização deve ter pelo menos 3 caracteres"),
  contact_phone: z.string()
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, "Telefone deve estar no formato (XX) XXXXX-XXXX")
    .optional(),
  contact_email: z.string().email("Email de contato inválido").optional(),
  images: z.array(z.string().url("URL de imagem inválida")).max(5, "Máximo 5 imagens")
});

// Message schemas
export const messageSchema = z.object({
  content: z.string()
    .min(1, "Mensagem não pode estar vazia")
    .max(1000, "Mensagem deve ter no máximo 1000 caracteres"),
  recipient_id: z.string().uuid("ID do destinatário inválido")
});

// Credit schemas
export const creditPurchaseSchema = z.object({
  packId: z.enum(["pack_100", "pack_500", "pack_1000", "pack_5000"]),
  amount: z.number().min(1, "Valor inválido")
});

// Profile schemas
export const profileUpdateSchema = z.object({
  full_name: z.string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .optional(),
  avatar_url: z.string().url("URL do avatar inválida").optional()
});

// Search schemas
export const searchSchema = z.object({
  query: z.string().min(1, "Digite alguma coisa para buscar").max(100, "Busca deve ter no máximo 100 caracteres"),
  category: z.string().optional(),
  location: z.string().optional(),
  min_price: z.number().min(0).optional(),
  max_price: z.number().min(0).optional(),
  radius: z.number().min(1).max(100).optional()
}).refine((data) => {
  if (data.min_price && data.max_price) {
    return data.min_price <= data.max_price;
  }
  return true;
}, {
  message: "Preço mínimo deve ser menor que o máximo",
  path: ["max_price"]
});

// Location schemas
export const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  address: z.string().optional()
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ListingInput = z.infer<typeof listingSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type CreditPurchaseInput = z.infer<typeof creditPurchaseSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type LocationInput = z.infer<typeof locationSchema>;