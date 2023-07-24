import { writable } from "svelte/store"

export const guestUserCreation = writable({ name: undefined, email: undefined })
