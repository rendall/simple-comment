import * as dotenv from "dotenv";
dotenv.config()

// making sure that .env is not the same strings as in example.env
test('JWT_SECRET should be changed', () => { expect(process.env.JWT_SECRET).not.toBe('aXvEQ572fvOMvQQ36K2i2PE0bwEMg9qpqBWlnPhsa5OMF1vl9NyI3TxRH0DK') })
test('ADMIN_PASSWORD should be changed', () => { expect(process.env.ADMIN_PASSWORD).not.toBe('fzBj6Xl5VWrVQbEWsDXQe6dw2K2216xwxkYUjdib') })

test('JWT_SECRET should exist', () => { expect(process.env.JWT_SECRET).toBeDefined()})
test('ADMIN_PASSWORD should exist', () => { expect(process.env.ADMIN_PASSWORD).toBeDefined()})