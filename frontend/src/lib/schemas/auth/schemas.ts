import { z } from 'zod';

export const registrationSchema = z
	.object({
		email: z.string().email(),
		username: z.string().min(3).max(50),
		password: z
			.string()
			.min(8, 'Password must be at least 8 characters')
			.regex(/[A-Z]/, 'Must contain uppercase letter')
			.regex(/[a-z]/, 'Must contain lowercase letter')
			.regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Must contain special character'),
		repeatPassword: z.string(),
		public_key: z.string().min(1),
		identity_public_key: z.string().min(1)
	})
	.refine((data) => data.password == data.repeatPassword, {
		message: 'Passwords must be equal',
		path: ['repeatPassword']
	});

export const loginSchema = z.object({
	email: z.string().email(),
	password: z.string()
});