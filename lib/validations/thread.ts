import * as z from 'zod';

export const threadValidation = z.object({
    thread: z.string().nonempty().min(3, { message: "Thread must be at least 3 characters long" }),
    accountId: z.string().nonempty(),
});

export const commentValidation = z.object({
    thread: z.string().nonempty().min(3, { message: "Thread must be at least 3 characters long" }),
});

